import { CMSPage, SliderItem, CommitteeMember, GalleryImage, ContactInfo } from '../../domain/models/cms.model';
import {
  CMSPageCreateRequestDto,
  CMSPageUpdateRequestDto,
  SliderCreateRequestDto,
  SliderUpdateRequestDto,
  CommitteeCreateRequestDto,
  CommitteeUpdateRequestDto,
  GalleryCreateRequestDto,
  ContactInfoUpdateRequestDto,
} from '../../domain/dto/cms.dto';

export interface ICmsService {
  getPages(): Promise<CMSPage[]>;
  getPageBySlug(slug: string): Promise<CMSPage>;
  createPage(dto: CMSPageCreateRequestDto): Promise<CMSPage>;
  updatePage(id: number, dto: CMSPageUpdateRequestDto): Promise<CMSPage>;

  getSliders(): Promise<SliderItem[]>;
  createSlider(dto: SliderCreateRequestDto): Promise<SliderItem>;
  updateSlider(id: number, dto: SliderUpdateRequestDto): Promise<SliderItem>;

  getCommittee(): Promise<CommitteeMember[]>;
  createCommitteeMember(dto: CommitteeCreateRequestDto): Promise<CommitteeMember>;
  updateCommitteeMember(id: number, dto: CommitteeUpdateRequestDto): Promise<CommitteeMember>;

  getGallery(album?: string): Promise<GalleryImage[]>;
  createGalleryImage(dto: GalleryCreateRequestDto): Promise<GalleryImage>;

  getContactInfo(): Promise<ContactInfo>;
  updateContactInfo(id: number, dto: ContactInfoUpdateRequestDto): Promise<ContactInfo>;
}
