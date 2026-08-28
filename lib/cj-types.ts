export type CJResponse<T> = {
  code?: number;
  result?: boolean;
  message?: string;
  data: T;
  requestId?: string;
  success?: boolean;
  pointsInfo?: CJPointsInfo;
};

export type CJPaging<T> = {
  pageNum?: number;
  pageSize?: number;
  total?: number;
  list?: T[];
};

export type CJPointsInfo = {
  usedToday?: number;
  remaining?: number;
  total?: number;
  [key: string]: unknown;
};

export type CJArea = {
  areaId?: string;
  areaEn?: string;
  countryCode?: string;
};

export type CJPeople = {
  creator?: string;
  createTime?: string;
  updater?: string;
  updateTime?: string;
};

export type CJSourceType = 0 | 1 | 2;

export type CJSource = {
  sourceFrom?: CJSourceType;
  comment?: string;
};

export type CJAuthCredentials = {
  email?: string;
  password?: string;
};

export type CJTokenData = {
  accessToken?: string;
  accessTokenExpiryDate?: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
};

export type CJAccountInfo = {
  openId?: string;
  openName?: string;
  openEmail?: string;
  root?: "NO_PERMISSION" | "GENERAL" | "VIP" | "ADMIN";
  isSandbox?: 0 | 1;
};

export type CJQuotaLimit = {
  quotaUrl?: string;
  quotaLimit?: number;
  quotaType?: 0 | 1 | 2 | 3 | 4 | 5;
  qpsLimit?: number;
};

export type CJApiSetting = {
  setting?: string[];
  quotaLimits?: CJQuotaLimit[];
};

export type CJProduct = {
  pid?: string;
  productName?: string;
  productNameEn?: string;
  productSku?: string;
  productImage?: string;
  productWeight?: number;
  productType?: string;
  productUnit?: string;
  categoryId?: string;
  categoryName?: string;
  entryCode?: string;
  entryName?: string;
  entryNameEn?: string;
  materialName?: string;
  materialNameEn?: string;
  materialKey?: string;
  packWeight?: number;
  packingName?: string;
  packingNameEn?: string;
  packingKey?: string;
  isActive?: boolean;
  description?: string;
  // Returned by product/query (v2 API):
  descriptionEn?: string;
  bigImage?: string;
  productImageSet?: string[];
  videoUrl?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  discountPrice?: number | string;
  listPrice?: number | string;
};

export type CJProductVariant = {
  vid?: string;
  variantName?: string;
  variantNameEn?: string;
  variantSku?: string;
  variantUnit?: string;
  variantProperty?: string;
  variantKey?: string;
  variantLength?: number;
  variantWidth?: number;
  variantHeight?: number;
  variantVolume?: number;
  variantWeight?: number;
  variantSellPrice?: number;
};

export type CJSupplier = Record<string, unknown>;

export type CJStorage = {
  storageNum?: number;
  queryTime?: string;
};

export type CJWarehouse = {
  storageId?: string;
  storageName?: string;
};

export type CJOrderStatus =
  | "CREATED"
  | "IN_CART"
  | "UNPAID"
  | "UNSHIPPED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type CJOrder = {
  orderId?: string;
  orderWeight?: number;
  orderAmount?: number;
  orderStatus?: CJOrderStatus;
};

export type CJAmount = {
  noWithdrawalAmount?: string;
  freezeAmount?: string;
  amount?: string;
};

export type CJShipping = {
  shippingCountryCode?: string;
  shippingCountry?: string;
  shippingProvince?: string;
  shippingCity?: string;
  shippingAddress?: string;
  shippingZip?: string;
  shippingPhone?: string;
};

export type CJLogistics = {
  logisticPrice?: string;
  logisticPriceCn?: string;
  logisticAging?: string;
  logisticName?: string;
};

export type CJTracking = {
  trackingNumber?: string;
  trackingFrom?: string;
  trackingTo?: string;
  deliveryDay?: string;
  deliveryTime?: string;
  trackingStatus?: string;
};
