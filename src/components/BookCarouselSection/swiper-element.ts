import { register } from 'swiper/element/bundle';

if (!customElements.get('swiper-container')) {
  register();
}
