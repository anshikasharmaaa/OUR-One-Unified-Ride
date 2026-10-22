import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '../common/TextField';
import Icon from '../common/Icon';
import { useToast } from '../../context/ToastContext';
import { contactSchema } from '../../utils/validators';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '../../config/contact';
import styles from './Contact.module.css';

const Phone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export default function Contact() {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(contactSchema), defaultValues: { name: '', email: '', message: '' } });

  // No server mailbox yet, so the form opens the visitor's own email app addressed to OUR.
  const onSubmit = ({ name, email, message }) => {
    const subject = encodeURIComponent(`OUR enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    toast.info('Opening your email app to send this message.');
    reset();
  };

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.banner}>
        <div className="container">
          <p className={styles.eyebrow}>Contact</p>
          <h2 id="contact-title">Contact us</h2>
          <p>Questions, feedback or ideas for the cities you want next — OUR is ready to listen.</p>
        </div>
      </div>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.card}>
          <div className={styles.info}>
            <h3>Get in touch</h3>
            <p className={styles.sub}>Write to us or call — we’ll get back to you as soon as we can.</p>
            <ul>
              <li><span className={styles.icon}><Icon name="mail" size={22} /></span><div><strong>Email us</strong><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div></li>
              <li><span className={styles.icon}><Phone /></span><div><strong>Call us</strong><a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a></div></li>
            </ul>
          </div>
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Contact form">
            <h3>Send us a message</h3>
            <div className={styles.two}>
              <TextField label="Your name" autoComplete="name" error={errors.name?.message} {...register('name')} />
              <TextField label="Your email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
            </div>
            <div className={styles.area}>
              <label htmlFor="contact-message">Message</label>
              <textarea id="contact-message" rows={4} aria-invalid={errors.message ? 'true' : undefined} aria-describedby={errors.message ? 'contact-message-err' : undefined} {...register('message')} />
              {errors.message && <p id="contact-message-err" role="alert" className={styles.err}>{errors.message.message}</p>}
            </div>
            <button type="submit" className={styles.send}>Send message</button>
          </form>
        </div>
      </div>
    </section>
  );
}