import React, { useState } from "react";
import PropTypes from "prop-types";
import { FaPhoneAlt, FaWhatsapp, FaFacebookMessenger } from "react-icons/fa";

export default function ContactBar({ phoneNumber, isMobile, telHref, waHref, contactId }) {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-2">
      {phoneNumber && (
        <div className="relative">
          {!showPhone ? (
            <button
              onClick={() => setShowPhone(true)}
              className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition flex items-center justify-center gap-2"
            >
              <FaPhoneAlt />
              <span>הצג מספר טלפון</span>
            </button>
          ) : isMobile && telHref ? (
            <a
              href={telHref}
              className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition inline-flex items-center justify-center gap-2"
            >
              <FaPhoneAlt />
              {phoneNumber}
            </a>
          ) : (
            <a
              href={telHref || "#"}
              className="h-9 min-w-[160px] px-3 rounded-md text-white text-xs font-medium bg-emerald-400 hover:bg-emerald-500/90 shadow-sm transition inline-flex items-center justify-center gap-2"
            >
              <FaPhoneAlt />
              {phoneNumber}
            </a>
          )}
        </div>
      )}

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-2 rounded-md bg-[#35d984] text-white text-xs font-medium hover:bg-emerald-500/90 shadow-sm inline-flex items-center justify-center gap-2"
        >
          <FaWhatsapp className="text-base" />
          WhatsApp
        </a>
      )}

      {contactId && (
        <a
          href={`https://m.me/${contactId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-2 rounded-md bg-[#42a5ff] text-white text-xs font-medium hover:bg-sky-500/90 shadow-sm inline-flex items-center justify-center gap-2"
        >
          <FaFacebookMessenger className="text-base" />
          שלח/י הודעה ב-Messenger
        </a>
      )}
    </div>
  );
}

ContactBar.propTypes = {
  phoneNumber: PropTypes.string,
  isMobile: PropTypes.bool,
  telHref: PropTypes.string,
  waHref: PropTypes.string,
  contactId: PropTypes.string,
};
