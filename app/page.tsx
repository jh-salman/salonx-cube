import Script from "next/script";

export default function Home() {
  return (
    <>
      <div id="app" data-editable="true" />
      <Script src="/cube-bundle.js" strategy="afterInteractive" />
    </>
  );
}
