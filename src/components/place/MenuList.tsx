'use client';

import Image from 'next/image';
import { MenuItem } from '@/types';

interface Props { items: MenuItem[]; }

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function MenuList({ items }: Props) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 transition-colors group"
        >
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-gray-700 flex-shrink-0 overflow-hidden">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🍴</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
            {item.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
            )}
          </div>

          {/* Price */}
          <p className="text-sm font-bold text-orange-400 flex-shrink-0">
            {formatPrice(Number(item.price))}
          </p>
        </li>
      ))}
    </ul>
  );
}
