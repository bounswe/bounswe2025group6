import React from 'react';
import '../../styles/TermsContent.css';
import { useTranslation } from 'react-i18next';

const TermsContent = () => {
  const { t } = useTranslation();
  return (
    <div className="terms-content">
      <p className="terms-last-updated">{t('terms.lastUpdated')}</p>

      <p className="terms-intro">{t('terms.intro')}</p>

      <h2>{t('terms.section1.title')}</h2>
      <p>{t('terms.section1.p1')}</p>
      <p>{t('terms.section1.p2')}</p>
      <p>{t('terms.section1.p3')}</p>

      <h2>{t('terms.section2.title')}</h2>
      <p>{t('terms.section2.p1')}</p>

      <h2>{t('terms.section3.title')}</h2>
      <p>{t('terms.section3.p1')}</p>

      <h2>{t('terms.section4.title')}</h2>
      <p>{t('terms.section4.p1')}</p>
      <p>{t('terms.section4.p2')}</p>
      <p>{t('terms.section4.p3')}</p>

      <h2>{t('terms.section5.title')}</h2>
      <p>{t('terms.section5.p1')}</p>
      <p>{t('terms.section5.p2')}</p>
      <p>{t('terms.section5.p3')}</p>

      <h2>{t('terms.section6.title')}</h2>
      <p>{t('terms.section6.p1')}</p>
      <ul>
        <li>{t('terms.section6.li1')}</li>
        <li>{t('terms.section6.li2')}</li>
        <li>{t('terms.section6.li3')}</li>
        <li>{t('terms.section6.li4')}</li>
        <li>{t('terms.section6.li5')}</li>
      </ul>

      <h2>{t('terms.section7.title')}</h2>
      <p>{t('terms.section7.p1')}</p>

      <h2>{t('terms.section8.title')}</h2>
      <p>{t('terms.section8.p1')}</p>

      <h2>{t('terms.section9.title')}</h2>
      <p>{t('terms.section9.p1')}</p>

      <h2>{t('terms.section10.title')}</h2>
      <p>{t('terms.section10.p1')}</p>

      <h2>{t('terms.section11.title')}</h2>
      <p>{t('terms.section11.p1')}</p>

      <h2>{t('terms.section12.title')}</h2>
      <p>{t('terms.section12.p1')}</p>
    </div>
  );
};

export default TermsContent;
