'use client';

import { LuArrowUpDown } from 'react-icons/lu';
import PillSelect from './PillSelect';

/** tenpo.com's sort options ("featured" keeps the directory's own order). */
export const SORTS = [
  { value: 'featured', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'soonest', label: 'Soonest start date' },
] as const;

export type Sort = (typeof SORTS)[number]['value'];

type Props = {
  value: Sort;
  onChange: (sort: Sort) => void;
  /** Sorts that can't apply (no prices or dates) are left out. */ options?: readonly Sort[];
};

/** The "Recommended" sort pill at the right of the filter bar, with its drop-down list. */
export default function SortSelect({ value, onChange, options = SORTS.map((s) => s.value) }: Props) {
  return (
    <PillSelect
      value={value}
      options={SORTS.filter((s) => options.includes(s.value))}
      onChange={onChange}
      label="Sort results"
      icon={<LuArrowUpDown />}
    />
  );
}
