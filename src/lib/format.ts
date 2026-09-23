export const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const categoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    All: 'Todos',
    Accessories: 'Acessórios',
    Apparel: 'Vestuário',
    Tech: 'Tech',
    Home: 'Casa',
    Outdoor: 'Outdoor',
    Wellness: 'Bem-estar',
    Travel: 'Viagem',
  };

  return labels[category] ?? category;
};
