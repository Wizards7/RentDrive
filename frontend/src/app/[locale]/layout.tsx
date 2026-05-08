import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";
import "sileo/styles.css";
import { routing } from "@/src/i18n/routing";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Providers } from "@/src/components/providers";
import { SupportChat } from "@/src/components/SupportChat";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("auth_token");

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground overflow-x-hidden">
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <main className="flex-1">
              {children}
            </main>
            <SupportChat />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
