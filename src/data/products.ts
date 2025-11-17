export interface Product {
  id: number | string;
  name: string;
  price: number;
  category: string;
  scent: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  stock: number;
  bestseller?: boolean;
  volume: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Esensi Oud Royal",
    price: 4500000,
    category: "Oud Premium",
    scent: "Oud, Amber, Kayu Cendana",
    description: "Campuran mewah dari kayu oud langka dan aroma amber hangat, menciptakan aroma tanda tangan yang tak terlupakan.",
    image: "product-1.jpg",
    rating: 4.9,
    reviews: 127,
    stock: 45,
    bestseller: true,
    volume: "100ml"
  },
  {
    id: "2",
    name: "Romansa Rose Oud",
    price: 3750000,
    category: "Oud Floral",
    scent: "Mawar, Oud, Melati",
    description: "Fusi memikat dari kelopak mawar Damaskus dan oud berharga, sempurna untuk malam elegan.",
    image: "product-2.jpg",
    rating: 4.8,
    reviews: 98,
    stock: 32,
    bestseller: true,
    volume: "50ml"
  },
  {
    id: "3",
    name: "Prestise Amber Oud",
    price: 5250000,
    category: "Oud Premium",
    scent: "Amber, Oud, Musk",
    description: "Amber kaya dan oud menciptakan aroma yang kuat dan tahan lama untuk para peminat yang cerdas.",
    image: "product-3.jpg",
    rating: 4.9,
    reviews: 156,
    stock: 28,
    bestseller: true,
    volume: "100ml"
  },
  {
    id: "4",
    name: "Mistik Sandalwood Oud",
    price: 4200000,
    category: "Oud Kayu",
    scent: "Kayu Cendana, Oud, Cedar",
    description: "Kayu cendana krimi yang harmonis dicampur dengan oud tua untuk aroma kayu yang canggih.",
    image: "product-4.jpg",
    rating: 4.7,
    reviews: 89,
    stock: 41,
    volume: "75ml"
  },
  {
    id: "5",
    name: "Elegansi Musk Oud",
    price: 3450000,
    category: "Oud Musk",
    scent: "Musk Putih, Oud, Vanilla",
    description: "Campuran lembut namun memikat dari musk putih dan oud dengan sentuhan manis vanilla.",
    image: "product-1.jpg",
    rating: 4.6,
    reviews: 73,
    stock: 55,
    volume: "50ml"
  },
  {
    id: "6",
    name: "Royale Saffron Oud",
    price: 6000000,
    category: "Oud Premium",
    scent: "Saffron, Oud, Kulit",
    description: "Benang saffron mewah bertemu dengan oud kaya dan aroma kulit dalam komposisi kerajaan ini.",
    image: "product-2.jpg",
    rating: 5.0,
    reviews: 142,
    stock: 18,
    bestseller: true,
    volume: "100ml"
  }
];
