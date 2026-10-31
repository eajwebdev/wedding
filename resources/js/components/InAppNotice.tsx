import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, X } from "lucide-react";

// Messenger, Facebook and Instagram open links in their own built-in browser, where WebGL, music and tilt run poorly.
const inAppBrowser = /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Messenger|Instagram/i;

/** The same page as an Android intent that opens in Chrome (the #hash is dropped: it would break the intent syntax). */
function chromeIntent() {
  const { protocol, host, pathname, search } = window.location;
  return `intent://${host}${pathname}${search}#Intent;scheme=${protocol.replace(":", "")};package=com.android.chrome;end`;
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  // Older in-app browsers have no Clipboard API.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok ? Promise.resolve() : Promise.reject();
}

/** Sends Android guests from an in-app browser to Chrome, and shows iPhone guests how to open the invitation in Safari. */
export default function InAppNotice() {
  const [kind, setKind] = useState<"android" | "ios" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (!inAppBrowser.test(ua)) return;
    if (!/Android/i.test(ua)) { setKind("ios"); return; }
    setKind("android");
    // Try once per visit, so a blocked redirect can't loop; the button below stays as a manual way out.
    try {
      if (sessionStorage.getItem("ej-escaped") === "1") return;
      sessionStorage.setItem("ej-escaped", "1");
    } catch {}
    window.location.href = chromeIntent();
  }, []);

  if (!kind) return null;

  function copyLink() {
    copyText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="inapp-notice" role="note">
      <div className="inapp-text">
        <strong>Best viewed in your browser</strong>
        {kind === "android"
          ? <span>Open this invitation in Chrome for the music and 3D effects.</span>
          : <span>Tap the <b>···</b> menu, then <b>Open in browser</b> for the music and 3D effects.</span>}
      </div>
      {kind === "android"
        ? <a className="inapp-action" href={chromeIntent()}><ExternalLink size={14} /> Open</a>
        : <button type="button" className="inapp-action" onClick={copyLink}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}</button>}
      <button type="button" className="inapp-close" onClick={() => setKind(null)} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
