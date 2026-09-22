"use client";

// Tu número de WhatsApp, en formato internacional sin '+', espacios ni guiones.
const WHATSAPP_NUMBER = "56979347247";
const DEFAULT_MESSAGE = "Hola, tengo una consulta";

/**
 * Botón flotante fijo en la esquina inferior derecha que abre un chat de
 * WhatsApp directo contigo. Para cambiar el número, edita WHATSAPP_NUMBER
 * arriba (formato: código de país + número, sin '+').
 */
export function WhatsAppFloatingButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    DEFAULT_MESSAGE
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/30 transition-transform hover:scale-105 active:scale-95"
    >
      <svg
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="white"
        aria-hidden="true"
      >
        <path d="M16.004 2.667c-7.363 0-13.333 5.97-13.333 13.333 0 2.353.616 4.646 1.787 6.667L2.667 29.333l6.827-1.76a13.27 13.27 0 0 0 6.51 1.72h.006c7.363 0 13.333-5.97 13.333-13.333S23.367 2.667 16.004 2.667zm0 24.4a11.05 11.05 0 0 1-5.633-1.54l-.404-.24-4.052 1.045 1.08-3.947-.264-.406a11.04 11.04 0 0 1-1.7-5.913c0-6.107 4.967-11.073 11.077-11.073 6.107 0 11.073 4.966 11.073 11.076 0 6.107-4.966 11.073-11.077 11.073zm6.073-8.293c-.333-.167-1.966-.973-2.271-1.083-.305-.111-.526-.167-.748.167s-.858 1.083-1.052 1.305c-.194.222-.388.25-.72.083-.334-.166-1.41-.52-2.686-1.657-.993-.886-1.663-1.98-1.858-2.313-.194-.333-.02-.514.147-.68.15-.15.334-.389.5-.583.167-.194.222-.333.334-.556.111-.222.055-.417-.028-.583-.084-.167-.748-1.803-1.026-2.469-.27-.649-.545-.561-.748-.572a13.85 13.85 0 0 0-.638-.011.9.9 0 0 0-.694.29c-.222.222-.916.895-.916 2.184s.938 2.53 1.068 2.706c.13.176 1.848 2.822 4.477 3.957.625.27 1.113.432 1.494.554.628.2 1.199.171 1.65.104.503-.075 1.966-.804 2.244-1.582.278-.777.278-1.443.194-1.582-.083-.14-.305-.223-.638-.39z" />
      </svg>
    </a>
  );
}
