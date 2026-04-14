import { BaseRepository } from '../../api/base.repository';
import { CMSPage, SliderItem, CommitteeMember, GalleryImage, ContactInfo } from '../../../domain/models/cms.model';
import {
  CMSPageCreateRequestDto,
  CMSPageUpdateRequestDto,
  SliderCreateRequestDto,
  SliderUpdateRequestDto,
  CommitteeCreateRequestDto,
  CommitteeUpdateRequestDto,
  GalleryCreateRequestDto,
  ContactInfoUpdateRequestDto,
} from '../../../domain/dto/cms.dto';
import { ICmsService } from '../cms.service.interface';

interface CMSPageResponse {
  id: number;
  slug: string;
  title: string;
  content?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SliderResponse {
  id: number;
  title: string;
  description?: string | null;
  image_url: string;
  link_url?: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface CommitteeResponse {
  id: number;
  name: string;
  position: string;
  email: string;
  phone?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  department?: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
}

interface GalleryResponse {
  id: number;
  title: string;
  description?: string | null;
  image_url: string;
  thumbnail_url?: string | null;
  album?: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface ContactInfoResponse {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
}

const mapPage = (item: CMSPageResponse): CMSPage => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  content: item.content || undefined,
  metaTitle: item.meta_title || undefined,
  metaDescription: item.meta_description || undefined,
  isPublished: item.is_published,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapSlider = (item: SliderResponse): SliderItem => ({
  id: item.id,
  title: item.title,
  description: item.description || undefined,
  imageUrl: item.image_url,
  linkUrl: item.link_url || undefined,
  order: item.order,
  isActive: item.is_active,
  createdAt: item.created_at,
});

const mapCommittee = (item: CommitteeResponse): CommitteeMember => ({
  id: item.id,
  name: item.name,
  position: item.position,
  email: item.email,
  phone: item.phone || undefined,
  photoUrl: item.photo_url || undefined,
  bio: item.bio || undefined,
  department: item.department || undefined,
  isActive: item.is_active,
  order: item.order,
  createdAt: item.created_at,
});

const mapGallery = (item: GalleryResponse): GalleryImage => ({
  id: item.id,
  title: item.title,
  description: item.description || undefined,
  imageUrl: item.image_url,
  thumbnailUrl: item.thumbnail_url || undefined,
  album: item.album || undefined,
  order: item.order,
  isActive: item.is_active,
  createdAt: item.created_at,
});

const mapContact = (item: ContactInfoResponse): ContactInfo => ({
  id: item.id,
  name: item.name,
  email: item.email || undefined,
  phone: item.phone || undefined,
  website: item.website || undefined,
  address: item.address || undefined,
  city: item.city || undefined,
  state: item.state || undefined,
  country: item.country || undefined,
  postalCode: item.postal_code || undefined,
  facebook: item.facebook || undefined,
  twitter: item.twitter || undefined,
  linkedin: item.linkedin || undefined,
  instagram: item.instagram || undefined,
});

const toPagePayload = (dto: CMSPageCreateRequestDto | CMSPageUpdateRequestDto) => ({
  slug: 'slug' in dto ? dto.slug : undefined,
  title: dto.title,
  content: dto.content,
  meta_title: dto.metaTitle,
  meta_description: dto.metaDescription,
  meta_keywords: 'metaKeywords' in dto ? dto.metaKeywords : undefined,
  is_published: 'isPublished' in dto ? dto.isPublished : undefined,
});

const toSliderPayload = (dto: SliderCreateRequestDto | SliderUpdateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  image_url: dto.imageUrl,
  link_url: dto.linkUrl,
  order: dto.order,
  is_active: 'isActive' in dto ? dto.isActive : undefined,
});

const toCommitteePayload = (dto: CommitteeCreateRequestDto | CommitteeUpdateRequestDto) => ({
  name: dto.name,
  position: dto.position,
  email: dto.email,
  phone: dto.phone,
  bio: dto.bio,
  department: dto.department,
  is_active: 'isActive' in dto ? dto.isActive : undefined,
  order: 'order' in dto ? dto.order : undefined,
});

const toGalleryPayload = (dto: GalleryCreateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  image_url: dto.imageUrl,
  album: dto.album,
});

const toContactPayload = (dto: ContactInfoUpdateRequestDto) => ({
  name: dto.name,
  email: dto.email,
  phone: dto.phone,
  website: dto.website,
  address: dto.address,
  city: dto.city,
  state: dto.state,
  country: dto.country,
  postal_code: dto.postalCode,
  facebook: dto.facebook,
  twitter: dto.twitter,
  linkedin: dto.linkedin,
  instagram: dto.instagram,
});

export class CmsService extends BaseRepository implements ICmsService {
  constructor() {
    super('/cms');
  }

  async getPages(): Promise<CMSPage[]> {
    const response = await this.get<CMSPageResponse[]>('/pages');
    return response.map(mapPage);
  }

  async getPageBySlug(slug: string): Promise<CMSPage> {
    const response = await this.get<CMSPageResponse>(`/pages/${slug}`);
    return mapPage(response);
  }

  async createPage(dto: CMSPageCreateRequestDto): Promise<CMSPage> {
    const response = await this.post<CMSPageResponse>('/pages', toPagePayload(dto));
    return mapPage(response);
  }

  async updatePage(id: number, dto: CMSPageUpdateRequestDto): Promise<CMSPage> {
    const response = await this.put<CMSPageResponse>(`/pages/${id}`, toPagePayload(dto));
    return mapPage(response);
  }

  async getSliders(): Promise<SliderItem[]> {
    const response = await this.get<SliderResponse[]>('/sliders');
    return response.map(mapSlider);
  }

  async createSlider(dto: SliderCreateRequestDto): Promise<SliderItem> {
    const response = await this.post<SliderResponse>('/sliders', toSliderPayload(dto));
    return mapSlider(response);
  }

  async updateSlider(id: number, dto: SliderUpdateRequestDto): Promise<SliderItem> {
    const response = await this.put<SliderResponse>(`/sliders/${id}`, toSliderPayload(dto));
    return mapSlider(response);
  }

  async getCommittee(): Promise<CommitteeMember[]> {
    const response = await this.get<CommitteeResponse[]>('/committee');
    return response.map(mapCommittee);
  }

  async createCommitteeMember(dto: CommitteeCreateRequestDto): Promise<CommitteeMember> {
    const response = await this.post<CommitteeResponse>('/committee', toCommitteePayload(dto));
    return mapCommittee(response);
  }

  async updateCommitteeMember(id: number, dto: CommitteeUpdateRequestDto): Promise<CommitteeMember> {
    const response = await this.put<CommitteeResponse>(`/committee/${id}`, toCommitteePayload(dto));
    return mapCommittee(response);
  }

  async getGallery(album?: string): Promise<GalleryImage[]> {
    const response = await this.get<GalleryResponse[]>('/gallery', { params: { album } });
    return response.map(mapGallery);
  }

  async createGalleryImage(dto: GalleryCreateRequestDto): Promise<GalleryImage> {
    const response = await this.post<GalleryResponse>('/gallery', toGalleryPayload(dto));
    return mapGallery(response);
  }

  async getContactInfo(): Promise<ContactInfo> {
    const response = await this.get<ContactInfoResponse>('/contact');
    return mapContact(response);
  }

  async updateContactInfo(id: number, dto: ContactInfoUpdateRequestDto): Promise<ContactInfo> {
    const response = await this.put<ContactInfoResponse>(`/contact/${id}`, toContactPayload(dto));
    return mapContact(response);
  }
}
