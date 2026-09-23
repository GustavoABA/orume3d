# ShopLite Store

![Deploy](https://github.com/Salama-Malek/shoplite-store/actions/workflows/deploy.yml/badge.svg)

Live demo: https://salama-malek.github.io/shoplite-store/

![Screenshot of the app](docs/screenshot.jpg)

A fast, dark-themed React storefront demo for browsing, filtering, and buying a curated product catalog.

## Overview

ShopLite Store is a single-page e-commerce front end built with React, TypeScript, and Tailwind CSS. It showcases a product catalog with search, category filtering, sorting, pagination, a wishlist, a shopping cart with tax/total calculation, and a mock checkout flow, all persisted to `localStorage` so the cart and preferences survive a page reload.

## Features

- Product catalog with client-side search, category filtering, and sorting (price/name, ascending/descending)
- Infinite-scroll style pagination ("load more") via a reusable `usePagination` hook
- Product detail modal with a "recently viewed" rail
- Wishlist page with persisted favorites, synced through `localStorage`
- Shopping cart drawer with quantity controls, subtotal/tax/total calculation, and a mock checkout confirmation
- Toast notifications for cart actions
- Responsive mobile filter/sort modal (built on Headless UI) separate from the desktop filter bar
- Keyboard shortcut (Cmd/Ctrl+K) to focus the search bar
- Scroll-aware header and a "back to top" button
- Skeleton loading states and Framer Motion animations throughout
- Dark theme by default via Tailwind's class-based dark mode

## Tech stack

- React 18 + TypeScript
- Vite (dev server and build)
- Tailwind CSS (with a custom color/animation theme)
- Framer Motion (animations)
- Headless UI (accessible dialogs/menus)
- Heroicons (icon set)
- react-hot-toast (toast notifications)

## Getting started

### Prerequisites

- Node.js (LTS recommended) and npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Starts the Vite dev server (default: http://localhost:5173).

### Build for production

```bash
npm run build
```

Type-checks the project with `tsc` and produces an optimized build in `dist/`.

### Preview a production build

```bash
npm run preview
```

There is no test script configured in this project. No environment variables are required to run it.

## Project structure

```
index.html                 Vite entry HTML
src/
  main.tsx                 App bootstrap: mounts React and wraps App in context providers
  App.tsx                  Top-level layout, routing between Home and Wishlist, cart drawer
  pages/
    Home.tsx               Catalog page: search, filters, sort, pagination, product modal
    Wishlist.tsx           Saved products page
  components/
    common/                Header, Footer, SearchBar, CategoryFilter, SortMenu, FilterModal,
                            SkeletonCard, BackToTopButton
    shop/                  ProductCard, ProductGrid, ProductModal, CartDrawer,
                            WishlistButton, RecentlyViewed
  context/                 CartContext, PreferencesContext (wishlist/recently viewed), ToastContext
  data/products.ts         Static product catalog and categories
  hooks/                   useLocalStorage, usePagination
  styles/index.css         Tailwind entry point
```

Build configuration lives in `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, and `tsconfig.json`.

## License

MIT. See [LICENSE](LICENSE).
