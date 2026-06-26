"use client";

import { useState } from "react";
import { skillGroups } from "@/data/rh/skills.catalog";

export function SkillPicker({
  title,
  description,
  selected,
  onChange,
}: {
  title: string;
  description: string;
  selected: string[];
  onChange: (skills: string[]) => void;
}) {
  const [area, setArea] = useState(skillGroups[0]?.area ?? "");

  const currentGroup = skillGroups.find((group) => group.area === area);
  const options = currentGroup
    ? Array.from(new Set([...currentGroup.perfil, ...currentGroup.funcoes]))
    : [];

  function toggle(skill: string) {
    if (selected.includes(skill)) {
      onChange(selected.filter((item) => item !== skill));
      return;
    }

    onChange([...selected, skill]);
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
      <div className="mb-4">
        <h3 className="text-xl font-black text-blue-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <select
        value={area}
        onChange={(event) => setArea(event.target.value)}
        className="mb-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-bold text-blue-950 outline-none"
      >
        {skillGroups.map((group) => (
          <option key={group.area} value={group.area}>
            {group.area}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {options.map((skill) => {
          const active = selected.includes(skill);

          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                active
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-blue-200 bg-white text-blue-950 hover:bg-blue-100"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>

      {selected.length > 0 ? (
        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="mb-2 text-sm font-black text-blue-950">
            Selecionados:
          </p>
          <p className="text-sm font-semibold leading-6 text-slate-600">
            {selected.join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
