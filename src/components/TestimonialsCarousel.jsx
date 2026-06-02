import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { motion } from 'framer-motion';

export default function TestimonialsCarousel() {
  const testimonials = [
    { name: "John D.", text: "Reliable service! Fixed my septic system fast." },
    { name: "Sarah L.", text: "Professional and friendly. Highly recommended." },
    { name: "Carlos M.", text: "Excellent work and quick response time!" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-20">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000 }}
        className="rounded-xl"
      >
        {testimonials.map((t, i) => (
          <SwiperSlide key={i}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-neutral-900 rounded-xl p-8 text-center border border-gray-700"
            >
              <p className="text-gray-300 italic mb-6">"{t.text}"</p>
              <p className="text-green-400 font-bold">- {t.name}</p>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
