import { useI18n } from '../i18n';

const TYPE_CLASS: Record<string, string> = {
  Planet: 'badge-planet',
  'Dwarf Planet': 'badge-dwarf',
  Moon: 'badge-moon',
  Asteroid: 'badge-asteroid',
  Comet: 'badge-comet',
  Star: 'badge-star',
};

export default function Badge({ type }: { type: string }) {
  const { typeLabel } = useI18n();
  return (
    <span className={`badge ${TYPE_CLASS[type] ?? 'badge-default'}`}>
      {typeLabel(type)}
    </span>
  );
}

export function typeClass(type: string): string {
  return TYPE_CLASS[type] ?? 'badge-default';
}
