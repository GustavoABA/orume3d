import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import type { OrderImageItem } from '../../lib/orderImages';

function ItemImage({ item, large }: { item: OrderImageItem; large?: boolean }) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = item.images.find(url => !failed.includes(url));
  return <div className={(large ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-16 w-16') + ' flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-paper/10 bg-background'}>
    {src ? <img src={src} alt={item.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(current => [...current, src])} className="h-full w-full object-contain" /> : <span className="flex flex-col items-center gap-1 px-1 text-center text-[10px] text-muted"><PhotoIcon className="h-5 w-5"/>Sem imagem</span>}
  </div>;
}

export default function OrderImages({ items, detail = false }: { items: OrderImageItem[]; detail?: boolean }) {
  return detail ? <div className="my-5 space-y-3" aria-label="Peças do pedido">{items.map((item,index) => <div key={index + item.name} className="flex items-center gap-4 rounded-xl border border-paper/10 p-3"><ItemImage key={item.images.join('|')} item={item} large/><div className="min-w-0"><p className="break-words text-sm font-semibold">{item.name}</p><p className="mt-2 text-xs text-muted">Quantidade: {item.quantity}</p></div></div>)}</div> : <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Imagens das peças">{items.slice(0,4).map((item,index) => <ItemImage key={index + item.name + item.images.join('|')} item={item}/>)}{items.length>4 && <span className="text-xs text-muted">+{items.length-4} peças</span>}</div>;
}
