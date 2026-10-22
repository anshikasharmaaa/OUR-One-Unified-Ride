import { Helmet } from 'react-helmet-async';
import Hero from '../../components/home/Hero';
import Explore from '../../components/home/Explore';
import WhyOur from '../../components/home/WhyOur';
import HowItWorks from '../../components/home/HowItWorks';
import About from '../../components/home/About';
import Faq from '../../components/home/Faq';
import AppSoon from '../../components/home/AppSoon';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>OUR — One Unified Ride · Every Ride. Every Option. One Search.</title>
        <meta name="description" content="Compare bikes, autos and cabs in one search. OUR helps you understand estimated fares and choose the right ride." />
      </Helmet>
      <Hero />
      <Explore />
      <WhyOur />
      <HowItWorks />
      <About />
      <Faq />
      <AppSoon />
    </>
  );
}