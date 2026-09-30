import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { BRAND } from "./branding";
import { LEGAL } from "./legal";
import { LOGO_MARK_PNG_BASE64, LOGO_MARK_SIZE } from "./logoData";
import { formatBankAmount, formatRate, parseBankPayment } from "./bankCurrency";
import { PROVIDER_LABEL, type Order } from "./types";
import { formatPrice, LOCALE, STORE_TIMEZONE } from "./utils";

// The built-in PDF fonts only cover Latin-1. Swap common typographic characters and drop
// anything else (e.g. Devanagari) so a product or customer name can never break the receipt.
const clean = (v: unknown) =>
  String(v ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const countryName = (code?: string) => {
  if (!code) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
};

const INK = rgb(0.17, 0.13, 0.11);
const MUTED = rgb(0.45, 0.42, 0.4);
const BRAND_COLOR = rgb(0.27, 0.13, 0.1);
const LINE = rgb(0.87, 0.85, 0.83);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: STORE_TIMEZONE });

/** Builds an A4 PDF receipt for a paid order. */
export async function buildReceiptPdf(order: Order): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(clean(`${BRAND.name} receipt - order #${order.order_number}`));
  pdf.setAuthor(clean(BRAND.name));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const M = 48; // margin
  const RIGHT = W - M;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  const text = (s: unknown, x: number, yy: number, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}) =>
    page.drawText(clean(s), { x, y: yy, size: opts.size ?? 10, font: opts.font ?? font, color: opts.color ?? INK });
  const textRight = (s: unknown, xRight: number, yy: number, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}) => {
    const f = opts.font ?? font;
    const size = opts.size ?? 10;
    const str = clean(s);
    page.drawText(str, { x: xRight - f.widthOfTextAtSize(str, size), y: yy, size, font: f, color: opts.color ?? INK });
  };
  const rule = (yy: number) => page.drawLine({ start: { x: M, y: yy }, end: { x: RIGHT, y: yy }, thickness: 0.7, color: LINE });
  /** Shortens a string with "..." so it fits the given width. */
  const fit = (s: unknown, maxWidth: number, f: PDFFont = font, size = 10) => {
    let str = clean(s);
    if (f.widthOfTextAtSize(str, size) <= maxWidth) return str;
    while (str.length > 1 && f.widthOfTextAtSize(`${str}...`, size) > maxWidth) str = str.slice(0, -1);
    return `${str}...`;
  };
  const newPageIfNeeded = (needed: number) => {
    if (y - needed < M + 40) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };

  // ---- Header: logo emblem + store details on the left, receipt details on the right ----
  let textX = M;
  try {
    const logo = await pdf.embedPng(Buffer.from(LOGO_MARK_PNG_BASE64, "base64"));
    const logoH = 56;
    const logoW = (LOGO_MARK_SIZE.width / LOGO_MARK_SIZE.height) * logoH;
    page.drawImage(logo, { x: M, y: y - logoH + 4, width: logoW, height: logoH });
    textX = M + logoW + 14;
  } catch {
    // If the logo can't be embedded, the receipt still renders with the store name alone.
  }
  text(BRAND.name, textX, y - 12, { size: 22, font: bold, color: BRAND_COLOR });
  textRight("RECEIPT", RIGHT, y - 10, { size: 18, font: bold, color: INK });
  y -= 28;
  text(BRAND.tagline, textX, y, { size: 9, color: MUTED });
  textRight(`Order #${order.order_number}`, RIGHT, y, { size: 11, font: bold });
  y -= 13;
  text(`${BRAND.contact_email}  |  ${BRAND.phone_display}`, textX, y, { size: 9, color: MUTED });
  textRight(`Placed ${fmtDate(order.created_at)}`, RIGHT, y, { size: 9, color: MUTED });
  y -= 12;
  text(LEGAL.website.replace(/^https?:\/\//, ""), textX, y, { size: 9, color: MUTED });
  if (order.paid_at) textRight(`Paid ${fmtDate(order.paid_at)}`, RIGHT, y, { size: 9, color: MUTED });
  y -= 20;
  rule(y);
  y -= 24;

  // ---- Billed to / Payment ----
  const a = order.shipping_address ?? ({} as Order["shipping_address"]);
  const colB = M + 270;
  text("BILLED & SHIPPED TO", M, y, { size: 8, font: bold, color: MUTED });
  text("PAYMENT", colB, y, { size: 8, font: bold, color: MUTED });
  y -= 15;

  // If the name is entirely in a script the PDF font can't draw, fall back to a neutral label.
  const left = [
    clean(a.full_name) || "Customer",
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
    countryName(a.country),
    order.email,
    a.phone,
  ].filter((v) => clean(v)) as string[];
  const bank = order.payment_provider === "bank_transfer" ? parseBankPayment(order.payment_id) : null;
  const right: string[] = [order.payment_provider ? PROVIDER_LABEL[order.payment_provider] : "-", "Status: Paid"];
  if (bank?.currency && bank.amount != null) {
    right.push(`Amount paid: ${formatBankAmount(bank.amount, bank.currency)}`);
    if (bank.rate) right.push(`Rate: 1 ${order.currency} = ${formatRate(bank.rate)} ${bank.currency}`);
  }
  if (bank?.code) right.push(`Payment remark: ${bank.code}`);
  if (order.payment_reference) right.push(`Transaction ID: ${order.payment_reference}`);

  const rows = Math.max(left.length, right.length);
  for (let i = 0; i < rows; i++) {
    if (left[i]) text(fit(left[i], 250, i === 0 ? bold : font), M, y, { font: i === 0 ? bold : font });
    if (right[i]) text(fit(right[i], RIGHT - colB), colB, y);
    y -= 14;
  }
  y -= 12;

  // ---- Items table ----
  const colQty = RIGHT - 190;
  const colPrice = RIGHT - 95;
  const header = () => {
    rule(y + 12);
    text("ITEM", M, y, { size: 8, font: bold, color: MUTED });
    textRight("QTY", colQty, y, { size: 8, font: bold, color: MUTED });
    textRight("PRICE", colPrice, y, { size: 8, font: bold, color: MUTED });
    textRight("TOTAL", RIGHT, y, { size: 8, font: bold, color: MUTED });
    y -= 8;
    rule(y);
    y -= 16;
  };
  header();
  for (const item of order.order_items ?? []) {
    newPageIfNeeded(40);
    if (y === H - M) header();
    text(fit(item.name, colQty - M - 50), M, y);
    textRight(item.quantity, colQty, y);
    textRight(formatPrice(item.price, order.currency), colPrice, y);
    textRight(formatPrice(Number(item.price) * item.quantity, order.currency), RIGHT, y);
    y -= 18;
  }
  y += 4;
  rule(y);
  y -= 20;

  // ---- Totals ----
  newPageIfNeeded(120);
  const totalRow = (label: string, value: string, strong = false) => {
    textRight(label, colPrice, y, { font: strong ? bold : font, size: strong ? 11 : 10, color: strong ? INK : MUTED });
    textRight(value, RIGHT, y, { font: strong ? bold : font, size: strong ? 11 : 10 });
    y -= strong ? 18 : 15;
  };
  totalRow("Subtotal", formatPrice(order.subtotal, order.currency));
  if (Number(order.discount) > 0) totalRow(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`, `-${formatPrice(order.discount, order.currency)}`);
  totalRow("Shipping", Number(order.shipping) > 0 ? formatPrice(order.shipping, order.currency) : "Free");
  if (Number(order.tax) > 0) totalRow("Tax", formatPrice(order.tax, order.currency));
  y -= 2;
  page.drawLine({ start: { x: colPrice - 110, y: y + 10 }, end: { x: RIGHT, y: y + 10 }, thickness: 0.7, color: LINE });
  y -= 6;
  totalRow(`Total (${order.currency})`, formatPrice(order.total, order.currency), true);
  if (bank?.currency && bank.amount != null) {
    textRight(`Paid as ${formatBankAmount(bank.amount, bank.currency)}`, RIGHT, y, { size: 9, color: MUTED });
    y -= 14;
  }

  // ---- Footer ----
  const footerY = M;
  page.drawLine({ start: { x: M, y: footerY + 22 }, end: { x: RIGHT, y: footerY + 22 }, thickness: 0.7, color: LINE });
  text(`Thank you for supporting handmade. Questions? ${BRAND.contact_email} | ${BRAND.phone_display}`, M, footerY + 8, { size: 8.5, color: MUTED });
  textRight(`Receipt for order #${order.order_number}`, RIGHT, footerY + 8, { size: 8.5, color: MUTED });

  return pdf.save();
}
