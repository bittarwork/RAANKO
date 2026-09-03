/** MVP UI copy for English and Arabic. Dates remain Gregorian; money defaults to EUR. */
export const messages = {
  en: {
    appName: 'RAANKO',
    readOnlyBanner: 'Account is read-only — contact admin',
    trialEnding: 'Trial ending soon',
    invalidCredentials: 'Invalid credentials',
  },
  ar: {
    appName: 'راانكو',
    readOnlyBanner: 'الحساب للقراءة فقط — تواصل مع المسؤول',
    trialEnding: 'تنتهي الفترة التجريبية قريباً',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
  },
} as const;

export type AppLocale = keyof typeof messages;
