export interface CMSPage {
  id: number;
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SliderItem {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface CommitteeMember {
  id: number;
  name: string;
  position: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
  department?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  album?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface ContactInfo {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}
