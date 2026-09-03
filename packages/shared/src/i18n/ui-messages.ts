/** UI copy for company/portal/platform shells. Currency display remains EUR unless tenant overrides. */
export const uiMessages = {
  en: {
    companyShell: 'RAANKO Company',
    platformShell: 'RAANKO Admin',
    portalShell: 'Customer portal',
    readOnlyBanner: 'Account is read-only — contact admin',
  },
  ar: {
    companyShell: 'راانكو — الشركة',
    platformShell: 'راانكو — الإدارة',
    portalShell: 'بوابة العميل',
    readOnlyBanner: 'الحساب للقراءة فقط — تواصل مع المسؤول',
  },
} as const;

export type UiLocale = keyof typeof uiMessages;
