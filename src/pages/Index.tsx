import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import Gallery from "@/components/Gallery";
import StudioTour from "@/components/StudioTour";
import Packages from "@/components/Packages";
import Testimonials from "@/components/Testimonials";
import BookingForm from "@/components/BookingForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <Header />
      <HeroSlider />
      <Gallery />
      <StudioTour />
      <Packages />
      <Testimonials />
      <BookingForm />
      <Footer />
    </main>
  );
};

export default Index;
