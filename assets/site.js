'use strict';
const CONFIG = JSON.parse(document.getElementById('site-config').textContent);
const SHEET_URL = CONFIG.endpoint;
const lightbox = document.getElementById('brochure-lightbox');
let opener;
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  opener = button;
  lightbox.showModal();
  document.body.style.overflow = 'hidden';
}));
lightbox.querySelector('.close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  const box = lightbox.getBoundingClientRect();
  if (event.target === lightbox && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) lightbox.close();
});
lightbox.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus(); });
function getFormData(form) {
  const value = name => form.elements.namedItem(name).value.trim();
  const selected = (prefix, names) => names.filter(name => form.elements.namedItem(prefix + name).checked).join(', ');
  return {name:value('name'),email:value('email'),phone:value('phone'),date:value('date'),time:value('time'),
    interests:selected('interest-', ['brochure','pricelist','showflat']), units:selected('unit-', ['1br','2br','3br','4br','5br']),
    source:form.id === 'brochure-form' ? CONFIG.sources.lightbox : CONFIG.sources.page};
}
async function submitEnquiry(form) {
  const button = form.querySelector('.submit');
  if (button.disabled) return;
  const status = form.querySelector('.form-status');
  const data = getFormData(form);
  status.classList.remove('error');
  if (!SHEET_URL || SHEET_URL.includes('{{')) { status.textContent = 'Enquiries are not connected yet.'; status.classList.add('error'); return; }
  if (!data.interests || !data.units || !form.elements.namedItem('consent').checked) {
    status.textContent = !data.interests ? 'Choose at least one item you would like to receive.' : !data.units ? 'Choose at least one bedroom preference.' : 'Please confirm your consent before sending.';
    status.classList.add('error');
    return;
  }
  button.disabled = true;
  button.textContent = 'Sending your enquiry…';
  status.textContent = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(SHEET_URL, {method:'POST',body:JSON.stringify(data),signal:controller.signal});
    if (!response.ok) throw new Error('Request failed');
    const body = await response.text();
    // Accept the existing plain-text response as well as common Apps Script JSON responses.
    let result;
    try { result = JSON.parse(body); } catch { result = null; }
    if (result && (result.success === false || result.error || /error|fail/i.test(String(result.result || result.status || '')))) throw new Error('Submission rejected');
    button.textContent = 'Enquiry sent';
    status.textContent = 'Thank you. Your enquiry has been sent. We will contact you about your selected updates.';
  } catch (error) {
    button.disabled = false;
    button.innerHTML = 'Send my enquiry <svg class="i" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6.5 13.5l7-7M8 6.5h5.5V12"/></svg>';
    status.classList.add('error');
    status.textContent = error.name === 'AbortError' ? 'We could not confirm receipt. Your details are still here; please try again later.' : 'We could not confirm your enquiry was received. Your details are still here; please try again.';
  } finally { clearTimeout(timeout); }
}
document.querySelectorAll('.enquiry-form').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  if (form.reportValidity()) submitEnquiry(form);
}));

// The complete amenities table is in HTML; filters only narrow the visible rows.
document.querySelectorAll('[data-amenity-filter]').forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.amenityFilter;
  document.querySelectorAll('[data-amenity-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('.amenity-table tbody tr').forEach(row => {
    row.hidden = category !== 'all' && row.dataset.category !== category;
    if (!row.hidden) count++;
  });
  document.querySelector('.amenity-count').textContent = `${count} places shown`;
}));

// Floor plan viewer: accessible tabs (click, arrow keys, Home/End).
document.querySelectorAll('[data-plan-viewer]').forEach(viewer => {
  const tabs = [...viewer.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach(item => {
      const on = item === tab;
      item.setAttribute('aria-selected', String(on));
      item.tabIndex = on ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const keys = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1};
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
    });
  });
});
