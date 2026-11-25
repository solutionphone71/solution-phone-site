// seo_update.js – simple script to inject meta tags and JSON‑LD for FAQ pages
const fs = require('fs');
const path = require('path');

function updateFAQPage(filePath, faqs){
  let html = fs.readFileSync(filePath,'utf8');
  // Insert JSON‑LD before </head>
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(q=>({"@type":"Question","name":q.question,"acceptedAnswer":{"@type":"Answer","text":q.answer}}))
  };
  const scriptTag = `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;
  html = html.replace(/<\/head>/i, scriptTag+'\n</head>');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Updated', filePath);
}

// Example usage – load from custom_faq.json
const faqFile = path.join(__dirname,'..','data','custom_faq.json');
if (fs.existsSync(faqFile)){
  const data = JSON.parse(fs.readFileSync(faqFile,'utf8'));
  const faqs = Object.entries(data).map(([q,a])=>({question:q,answer:a}));
  const pages = ['faq.html']; // extend as needed
  pages.forEach(p=> updateFAQPage(path.join(__dirname,'..',p), faqs));
}
