export interface CMSPageCreateRequestDto {
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CMSPageUpdateRequestDto {
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished?: boolean;
}

export interface SliderCreateRequestDto {
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  order?: number;
}

export interface SliderUpdateRequestDto {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  order?: number;
  isActive?: boolean;
}

export interface CommitteeCreateRequestDto {
  name: string;
  position: string;
  email: string;
  phone?: string;
  bio?: string;
  department?: string;
}

export interface CommitteeUpdateRequestDto {
  name?: string;
  position?: string;
  email?: string;
  phone?: string;
  bio?: string;
  department?: string;
  isActive?: boolean;
  order?: number;
}

export interface GalleryCreateRequestDto {
  title: string;
  description?: string;
  imageUrl: string;
  album?: string;
}

export interface ContactInfoUpdateRequestDto {
  name?: string;
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
