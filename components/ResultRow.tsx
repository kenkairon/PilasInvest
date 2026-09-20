import Image from "next/image";
import type { DeviceResult } from "@/app/actions";
import { getCategoryIcon } from "@/lib/icons";

export function ResultRow({ result }: { result: DeviceResult }) {
  const { brand, category, battery, model_name, model_code, is_solar, no_battery } =
    result;
  const Icon = getCategoryIcon(category?.icon);

  return (
    <li className="flex items-start gap-4 border-b border-line py-5 first:pt-0 last:border-b-0">
      {result.image_url ? (
        <div className="relative shrink-0">
          <Image
            src={result.image_url}
            alt={`${brand?.name ?? ""} ${model_name}`}
            width={56}
            height={56}
            className="rounded-sm object-cover"
          />
          {result.image_url_2 && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-brass px-1.5 py-0.5 text-[10px] font-medium leading-none text-case">
              +1
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-case text-steel">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-steel">
          {category?.name} · {brand?.name}
        </p>
        <p className="truncate font-medium text-cream">
          {model_name}
          {model_code ? (
            <span className="ml-2 font-mono text-xs text-steel">
              {model_code}
            </span>
          ) : null}
        </p>

        {(is_solar || no_battery) && (
          <p className="mt-1 text-xs text-brass">
            {no_battery
              ? "No lleva pila reemplazable — es mecánico, a cuerda o cableado."
              : "Celda solar — no reemplazable en casa, lleva a servicio técnico."}
          </p>
        )}
      </div>

      {battery && !no_battery && (
        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-medium text-brass">
            {battery.code}
          </p>
          {battery.common_names?.length > 0 && (
            <p className="font-mono text-xs text-steel">
              {battery.common_names.join(" / ")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
