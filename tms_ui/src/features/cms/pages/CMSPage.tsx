import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';
import { cmsApi } from '../../../core/api/services/cms.api';
import { CMSPage as CMSPageModel, SliderItem, CommitteeMember, GalleryImage, ContactInfo } from '../../../domain/models/cms.model';
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
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';

const sectionLabels: Record<string, string> = {
  pages: 'Pages',
  sliders: 'Sliders',
  committee: 'Committee',
  gallery: 'Gallery',
  contact: 'Contact',
};

export const CMSPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get('section') || 'pages';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<CMSPageModel | SliderItem | CommitteeMember | GalleryImage | null>(null);

  const { data: pages = [] } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: () => cmsApi.getPages(),
    enabled: section === 'pages',
  });

  const { data: sliders = [] } = useQuery({
    queryKey: ['cms-sliders'],
    queryFn: () => cmsApi.getSliders(),
    enabled: section === 'sliders',
  });

  const { data: committee = [] } = useQuery({
    queryKey: ['cms-committee'],
    queryFn: () => cmsApi.getCommittee(),
    enabled: section === 'committee',
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ['cms-gallery'],
    queryFn: () => cmsApi.getGallery(),
    enabled: section === 'gallery',
  });

  const { data: contactInfo, error: contactError } = useQuery({
    queryKey: ['cms-contact'],
    queryFn: () => cmsApi.getContactInfo(),
    enabled: section === 'contact',
  });

  const createPageMutation = useMutation({
    mutationFn: (dto: CMSPageCreateRequestDto) => cmsApi.createPage(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create page'),
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CMSPageUpdateRequestDto }) => cmsApi.updatePage(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast.success('Page updated');
      setEditItemId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update page'),
  });

  const createSliderMutation = useMutation({
    mutationFn: (dto: SliderCreateRequestDto) => cmsApi.createSlider(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-sliders'] });
      toast.success('Slider created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create slider'),
  });

  const updateSliderMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SliderUpdateRequestDto }) => cmsApi.updateSlider(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-sliders'] });
      toast.success('Slider updated');
      setEditItemId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update slider'),
  });

  const createCommitteeMutation = useMutation({
    mutationFn: (dto: CommitteeCreateRequestDto) => cmsApi.createCommitteeMember(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-committee'] });
      toast.success('Committee member created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create committee member'),
  });

  const updateCommitteeMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CommitteeUpdateRequestDto }) => cmsApi.updateCommitteeMember(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-committee'] });
      toast.success('Committee member updated');
      setEditItemId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update committee member'),
  });

  const createGalleryMutation = useMutation({
    mutationFn: (dto: GalleryCreateRequestDto) => cmsApi.createGalleryImage(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-gallery'] });
      toast.success('Gallery image created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create gallery image'),
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ContactInfoUpdateRequestDto }) => cmsApi.updateContactInfo(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cms-contact'] });
      toast.success('Contact info updated');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update contact info'),
  });

  const pageColumns: Column<CMSPageModel>[] = useMemo(
    () => [
      { key: 'slug', label: 'Slug', sortable: false },
      { key: 'title', label: 'Title', sortable: false },
      { key: 'isPublished', label: 'Published', sortable: false, render: (value) => (value ? 'Yes' : 'No') },
    ],
    []
  );

  const sliderColumns: Column<SliderItem>[] = useMemo(
    () => [
      { key: 'title', label: 'Title', sortable: false },
      { key: 'imageUrl', label: 'Image', sortable: false },
      { key: 'order', label: 'Order', sortable: false },
      { key: 'isActive', label: 'Active', sortable: false, render: (value) => (value ? 'Yes' : 'No') },
    ],
    []
  );

  const committeeColumns: Column<CommitteeMember>[] = useMemo(
    () => [
      { key: 'name', label: 'Name', sortable: false },
      { key: 'position', label: 'Position', sortable: false },
      { key: 'email', label: 'Email', sortable: false },
      { key: 'isActive', label: 'Active', sortable: false, render: (value) => (value ? 'Yes' : 'No') },
    ],
    []
  );

  const galleryColumns: Column<GalleryImage>[] = useMemo(
    () => [
      { key: 'title', label: 'Title', sortable: false },
      { key: 'album', label: 'Album', sortable: false },
      { key: 'imageUrl', label: 'Image', sortable: false },
      { key: 'isActive', label: 'Active', sortable: false, render: (value) => (value ? 'Yes' : 'No') },
    ],
    []
  );

  const handleSectionChange = (value: string) => {
    setSearchParams({ section: value });
  };

  const handleCreate = (data: Record<string, any>) => {
    if (section === 'pages') {
      createPageMutation.mutate({
        slug: data.slug,
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
      });
    } else if (section === 'sliders') {
      createSliderMutation.mutate({
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        order: data.order,
      });
    } else if (section === 'committee') {
      createCommitteeMutation.mutate({
        name: data.name,
        position: data.position,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        department: data.department,
      });
    } else if (section === 'gallery') {
      createGalleryMutation.mutate({
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        album: data.album,
      });
    }
  };

  const handleUpdate = (data: Record<string, any>) => {
    if (!editItemId) return;
    if (section === 'pages') {
      updatePageMutation.mutate({
        id: editItemId,
        dto: {
          title: data.title,
          content: data.content,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          metaKeywords: data.metaKeywords,
          isPublished: data.isPublished,
        },
      });
    } else if (section === 'sliders') {
      updateSliderMutation.mutate({
        id: editItemId,
        dto: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          linkUrl: data.linkUrl,
          order: data.order,
          isActive: data.isActive,
        },
      });
    } else if (section === 'committee') {
      updateCommitteeMutation.mutate({
        id: editItemId,
        dto: {
          name: data.name,
          position: data.position,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          department: data.department,
          isActive: data.isActive,
          order: data.order,
        },
      });
    }
  };

  const handleContactSave = (data: Record<string, any>) => {
    if (!contactInfo) return;
    updateContactMutation.mutate({
      id: contactInfo.id,
      dto: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        facebook: data.facebook,
        twitter: data.twitter,
        linkedin: data.linkedin,
        instagram: data.instagram,
      },
    });
  };

  const currentTitle = sectionLabels[section] || 'CMS';

  const pageActions: RowAction<CMSPageModel>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (item) => setViewItem(item),
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: (item) => {
        setViewItem(item);
        setEditItemId(item.id);
      },
      variant: 'primary',
    },
  ];

  const sliderActions: RowAction<SliderItem>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (item) => setViewItem(item),
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: (item) => {
        setViewItem(item);
        setEditItemId(item.id);
      },
      variant: 'primary',
    },
  ];

  const committeeActions: RowAction<CommitteeMember>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (item) => setViewItem(item),
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: (item) => {
        setViewItem(item);
        setEditItemId(item.id);
      },
      variant: 'primary',
    },
  ];

  const galleryActions: RowAction<GalleryImage>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (item) => setViewItem(item),
      variant: 'secondary',
    },
  ];

  const createFields: FormField[] =
    section === 'pages'
      ? [
          { name: 'slug', label: 'Slug', type: 'text', required: true },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'content', label: 'Content', type: 'textarea' },
          { name: 'metaTitle', label: 'Meta Title', type: 'text' },
          { name: 'metaDescription', label: 'Meta Description', type: 'textarea' },
          { name: 'metaKeywords', label: 'Meta Keywords', type: 'text' },
        ]
      : section === 'sliders'
      ? [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'imageUrl', label: 'Image URL', type: 'text', required: true },
          { name: 'linkUrl', label: 'Link URL', type: 'text' },
          { name: 'order', label: 'Order', type: 'number' },
        ]
      : section === 'committee'
      ? [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'position', label: 'Position', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'bio', label: 'Bio', type: 'textarea' },
          { name: 'department', label: 'Department', type: 'text' },
        ]
      : [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'imageUrl', label: 'Image URL', type: 'text', required: true },
          { name: 'album', label: 'Album', type: 'text' },
        ];

  const editFields: FormField[] =
    section === 'pages'
      ? [
          { name: 'title', label: 'Title', type: 'text', defaultValue: (viewItem as CMSPageModel | null)?.title || '' },
          { name: 'content', label: 'Content', type: 'textarea', defaultValue: (viewItem as CMSPageModel | null)?.content || '' },
          { name: 'metaTitle', label: 'Meta Title', type: 'text', defaultValue: (viewItem as CMSPageModel | null)?.metaTitle || '' },
          { name: 'metaDescription', label: 'Meta Description', type: 'textarea', defaultValue: (viewItem as CMSPageModel | null)?.metaDescription || '' },
          { name: 'metaKeywords', label: 'Meta Keywords', type: 'text', defaultValue: (viewItem as CMSPageModel | null)?.metaKeywords || '' },
          { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: (viewItem as CMSPageModel | null)?.isPublished ?? false },
        ]
      : section === 'sliders'
      ? [
          { name: 'title', label: 'Title', type: 'text', defaultValue: (viewItem as SliderItem | null)?.title || '' },
          { name: 'description', label: 'Description', type: 'textarea', defaultValue: (viewItem as SliderItem | null)?.description || '' },
          { name: 'imageUrl', label: 'Image URL', type: 'text', defaultValue: (viewItem as SliderItem | null)?.imageUrl || '' },
          { name: 'linkUrl', label: 'Link URL', type: 'text', defaultValue: (viewItem as SliderItem | null)?.linkUrl || '' },
          { name: 'order', label: 'Order', type: 'number', defaultValue: (viewItem as SliderItem | null)?.order || 0 },
          { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: (viewItem as SliderItem | null)?.isActive ?? true },
        ]
      : section === 'committee'
      ? [
          { name: 'name', label: 'Name', type: 'text', defaultValue: (viewItem as CommitteeMember | null)?.name || '' },
          { name: 'position', label: 'Position', type: 'text', defaultValue: (viewItem as CommitteeMember | null)?.position || '' },
          { name: 'email', label: 'Email', type: 'email', defaultValue: (viewItem as CommitteeMember | null)?.email || '' },
          { name: 'phone', label: 'Phone', type: 'text', defaultValue: (viewItem as CommitteeMember | null)?.phone || '' },
          { name: 'bio', label: 'Bio', type: 'textarea', defaultValue: (viewItem as CommitteeMember | null)?.bio || '' },
          { name: 'department', label: 'Department', type: 'text', defaultValue: (viewItem as CommitteeMember | null)?.department || '' },
          { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: (viewItem as CommitteeMember | null)?.isActive ?? true },
          { name: 'order', label: 'Order', type: 'number', defaultValue: (viewItem as CommitteeMember | null)?.order || 0 },
        ]
      : [];

  const contactFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', defaultValue: contactInfo?.name || '', required: true },
    { name: 'email', label: 'Email', type: 'email', defaultValue: contactInfo?.email || '' },
    { name: 'phone', label: 'Phone', type: 'text', defaultValue: contactInfo?.phone || '' },
    { name: 'website', label: 'Website', type: 'text', defaultValue: contactInfo?.website || '' },
    { name: 'address', label: 'Address', type: 'textarea', defaultValue: contactInfo?.address || '' },
    { name: 'city', label: 'City', type: 'text', defaultValue: contactInfo?.city || '' },
    { name: 'state', label: 'State', type: 'text', defaultValue: contactInfo?.state || '' },
    { name: 'country', label: 'Country', type: 'text', defaultValue: contactInfo?.country || '' },
    { name: 'postalCode', label: 'Postal Code', type: 'text', defaultValue: contactInfo?.postalCode || '' },
    { name: 'facebook', label: 'Facebook', type: 'text', defaultValue: contactInfo?.facebook || '' },
    { name: 'twitter', label: 'Twitter', type: 'text', defaultValue: contactInfo?.twitter || '' },
    { name: 'linkedin', label: 'LinkedIn', type: 'text', defaultValue: contactInfo?.linkedin || '' },
    { name: 'instagram', label: 'Instagram', type: 'text', defaultValue: contactInfo?.instagram || '' },
  ];

  const activeDataTable = () => {
    if (section === 'pages') {
      return (
        <DataTable
          columns={pageColumns}
          data={pages}
          searchable={false}
          actions={{ add: { label: 'Add Page', onClick: () => setShowCreateModal(true) } }}
          rowActions={pageActions}
        />
      );
    }
    if (section === 'sliders') {
      return (
        <DataTable
          columns={sliderColumns}
          data={sliders}
          searchable={false}
          actions={{ add: { label: 'Add Slider', onClick: () => setShowCreateModal(true) } }}
          rowActions={sliderActions}
        />
      );
    }
    if (section === 'committee') {
      return (
        <DataTable
          columns={committeeColumns}
          data={committee}
          searchable={false}
          actions={{ add: { label: 'Add Member', onClick: () => setShowCreateModal(true) } }}
          rowActions={committeeActions}
        />
      );
    }
    if (section === 'gallery') {
      return (
        <DataTable
          columns={galleryColumns}
          data={gallery}
          searchable={false}
          actions={{ add: { label: 'Add Image', onClick: () => setShowCreateModal(true) } }}
          rowActions={galleryActions}
        />
      );
    }
    if (section === 'contact') {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {contactError ? (
            <p className="text-sm text-red-500">Contact info not found.</p>
          ) : (
            <DynamicForm
              fields={contactFields}
              onSubmit={handleContactSave}
              submitLabel="Save"
              isLoading={updateContactMutation.isPending}
            />
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CMS</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage pages, sliders, committee, gallery, and contact info.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(sectionLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSectionChange(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border ${section === key ? 'bg-[#006A4E] text-white border-[#006A4E]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentTitle}</h2>
      </div>

      {activeDataTable()}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={`Add ${currentTitle}`}>
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create"
          isLoading={createPageMutation.isPending || createSliderMutation.isPending || createCommitteeMutation.isPending || createGalleryMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editItemId !== null} onClose={() => setEditItemId(null)} title={`Edit ${currentTitle}`}>
        <DynamicForm
          fields={editFields}
          onSubmit={handleUpdate}
          onCancel={() => setEditItemId(null)}
          submitLabel="Save"
          isLoading={updatePageMutation.isPending || updateSliderMutation.isPending || updateCommitteeMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(viewItem)} onClose={() => setViewItem(null)} title={`${currentTitle} Details`}>
        {viewItem && (
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto">{JSON.stringify(viewItem, null, 2)}</pre>
        )}
      </Modal>
    </div>
  );
};
