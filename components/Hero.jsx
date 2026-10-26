import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-linear-to-r from-brand to-brand-dark py-[90px] max-md:py-10">
      <div className="wrap flex items-center justify-between gap-6 max-md:flex-col max-md:text-center">
        <div>
          <h1 className="text-[60px] leading-[60px] font-bold text-white max-md:text-[40px] max-md:leading-[44px]">Summer Sale</h1>
          <p className="pt-[18px] pb-8 text-xl leading-7 text-tint max-md:pt-3 max-md:pb-5 max-md:text-base">
            Up to 70% off on selected items. Limited time offer!
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-8 pt-3.5 pb-3 text-base font-semibold text-brand transition-colors hover:bg-tint"
          >
            Shop Now
          </Link>
        </div>
        <img
          className="mt-[90px] h-auto w-[592px] rounded-[10px] max-lg:w-[440px] max-md:mt-0 max-md:w-full max-md:max-w-[440px]" src="/img/hero.png" alt="Summer sale" width="592" height="320" />
      </div>
    </section>
  );
}
