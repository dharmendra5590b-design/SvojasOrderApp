import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DESIGNS = ['Ring', 'Necklace', 'Bracelet', 'Earring', 'Pendant', 'Bangle', 'Chain', 'Other'];
const KTS = ['14KT', '18KT', '22KT', '24KT'];
const TYPES = ['Plain Gold', 'Diamond', 'Gemstone', 'Mixed'];
const COLOURS = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Two Tone'];
const STONES = ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Other'];
const CERT_TYPES = ['GIA', 'IGI', 'HRD', 'SGL'];

const INIT = {
  design_ID: '', karat_ID: '', karat_Percent: '', design_Type_ID: '', gold_Colour_ID: '', size: '', weight: '',quantity:'',
  stone_ID: '', is_Colour_Required: false, colour_Stone_ID: '',colour_Stone:'', is_Certificate_Required: false,
  certificate_ID: '', diamond_Quality_ID: '',diamond_Weight:'',noOf_Diamonds:'', delivery_Date: '',
  orderType: 'new',specification:'',mode:'A'
};

const NewOrder = () => {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState({ frontImage: null, topImage: null, sideImage: null, backImage: null });
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState([]);
const [kts, setKts] = useState([]);
const [types, setTypes] = useState([]);
const [colours, setColours] = useState([]);
const [stones, setStones] = useState([]);
const [clrstones, setClrStones] = useState([]);
const [certTypes, setCertTypes] = useState([]);
const [quality, setQuality] = useState([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const load = async () => {
    try { const { data:order } = await api.get('https://api.jewelquote.in/api/order/GetListCustomerOrder',{employee_ID:0}); 
    setDesigns(order.design); 
    setKts(order.karat);
    setTypes(order.designType);
    setColours(order.goldColor);
    setStones(order.stones);
    setClrStones(order.clrStone);
    setCertTypes(order.certificate);
    setQuality(order.quality);
  //set("customer_ID",user.user_ID);
  } catch {}
  };
  useEffect(() => { load(); }, []);
  const validate = () => {
    const e = {};
    if (!form.design_ID) e.design_ID = 'Design type is required';
    if (!form.karat_ID) e.karat_ID = 'KT is required';
        if (!form.design_Type_ID) e.design_Type_ID = 'Design Type is required';
    if (!form.gold_Colour_ID) e.gold_Colour_ID = 'Gold Colour is required';
    if (!form.stone_ID) e.stone_ID = 'Stone is required';

    if (!form.delivery_Date) e.delivery_Date = 'Delivery date is required';
   if (!form.quantity) e.quantity = 'Quantiy is required';
    setErrors(e);
     if(images.frontImage==null ||  images.frontImage=="")
     {
      toast.error('Front Image is required');
      return false;
     }
     //set("customer_ID",user.user_ID)
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // customerId will be resolved in backend via logged-in user
      Object.entries(images).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("customer_ID",user.entity_ID)
    const {data} = await api.post('https://api.jewelquote.in/api/order/SaveOrder', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
     if(data.statusCode===1)
           {   
          toast.success('Order placed successfully');
           }
           else
           {
             toast.error(data?.message || 'Error saving order');
             return false;
           }
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error placing order');
    } finally { setLoading(false); }
  };

  const ImageUpload = ({ field, label }) => (
    <div>
      <label className="form-label small fw-semibold">{label}</label>
      <input type="file" className="form-control form-control-sm" accept="image/*"
        onChange={e => setImages(i => ({ ...i, [field]: e.target.files[0] }))} />
      {images[field] && (
        <img src={URL.createObjectURL(images[field])} alt={label}
          className="mt-1 rounded" style={{ width: 60, height: 60, objectFit: 'cover' }} />
      )}
    </div>
  );

  return (
    <div>
      <h5 className="fw-bold mb-4">New Order</h5>
      <form onSubmit={handleSubmit}>
       
                <input type='hidden' value={form['mode']} name='mode'></input>
        <div className="row g-3">
          {/* Design Specs */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">Design Specifications</div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design *</label>
                    <select className={`form-select ${errors.design_ID ? 'is-invalid' : ''}`}
                      value={form.design_ID} onChange={e => set('design_ID', e.target.value)}>
                      <option value="">Select Design</option>
                      {designs.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                    </select>
                    {errors.design_ID && <div className="invalid-feedback">{errors.design}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">KT *</label>
                    <select className={`form-select ${errors.karat_ID ? 'is-invalid' : ''}`}
                      value={form.karat_ID} onChange={e => (set('karat_ID', e.target.value), e.target.value !== '6' && set('karat_Percent', ''))}>
                      <option value="">Select KT</option>
                       {kts.map(k => <option key={k.value} value={k.value}>{k.text}</option>)}
                    </select>
                    {errors.karat_ID && <div className="invalid-feedback">{errors.karat_ID}</div>}
                  </div>
                  {form.karat_ID=="6"?
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Percent Value</label>
                    <input type="number" step="0.01" className="form-control"
                      value={form.karat_Percent} onChange={e => set('karat_Percent', e.target.value)} />
                  </div>:null}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design Type *</label>
                    <select className={`form-select ${errors.design_Type_ID ? 'is-invalid' : ''}`} value={form.design_Type_ID} onChange={e => set('design_Type_ID', e.target.value)}>
                      <option value="">Select Type</option>
                      {types.map(t => <option key={t.value} value={t.value}>{t.text}</option>)}
                    </select>
                    {errors.design_Type_ID && <div className="invalid-feedback">{errors.design_Type_ID}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Gold Colour *</label>
                    <select className="form-select" value={form.gold_Colour_ID} onChange={e => set('gold_Colour_ID', e.target.value)}>
                      <option value="">Select Colour</option>
                      {colours.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Size</label>
                    <input className="form-control" value={form.size} onChange={e => set('size', e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Gold Weight</label>
                    <input type="number" step="0.001" className="form-control"
                      value={form.weight} onChange={e => set('weight', e.target.value)} />
                  </div>
                   <div className="col-md-2">
                    <label className="form-label fw-semibold">Quality</label>
                    <input  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                       {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stone & Certificate */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Stone Details</div>
              <div className="card-body">
                <div className='row'>
                <div className="mb-1 col-md-6">
                  <label className="form-label fw-semibold">Stone *</label>
                  <select className={`form-select ${errors.stone_ID ? 'is-invalid' : ''}`} value={form.stone_ID} onChange={e => set('stone_ID', e.target.value)}>
                    <option value="">Select Stone</option>
                    {stones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                  </select>
                  {errors.stone_ID && <div className="invalid-feedback">{errors.stone_ID}</div>}
                </div>
                <div className="form-check mb-2 col-md-6">
                  <input className="form-check-input" type="checkbox" id="colourStone"
                    checked={form.is_Colour_Required} onChange={e => set('is_Colour_Required', e.target.checked)} />
                  <label className="form-check-label" htmlFor="colourStone">Colour Stone Required</label>
               
                {form.is_Colour_Required && (
                 <> <br/>
                  <select className="form-select mb-2 col-md-6" style={{marginTop:10}} value={form.colour_Stone_ID} onChange={e => (set('colour_Stone_ID', e.target.value), e.target.value !== '6' && set('colour_Stone', ''))}>
                    <option value="">Select Colour Stone</option>
                    {clrstones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                  </select>
                  </>
                )}
                </div>
                {form.is_Colour_Required && form.colour_Stone_ID=="3"?
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Percent Value</label>
                    <input type="number" step="0.01" className="form-control"
                      value={form.colour_Stone} onChange={e => set('colour_Stone', e.target.value)} />
                  </div>:null}
                   <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Quality </label>
                    <select className="form-select" value={form.diamond_Quality_ID} onChange={e => set('diamond_Quality_ID', e.target.value)}>
                      <option value="">Select Quality</option>
                      {quality.map(q => <option key={q.value} value={q.value}>{q.text}</option>)}
                    </select>
                    {errors.diamond_Quality_ID && <div className="invalid-feedback">{errors.diamond_Quality_ID}</div>}
                  </div>
                <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Weight</label>
                    <input className="form-control" value={form.diamond_Weight} onChange={e => set('diamond_Weight', e.target.value)} />
                  </div>
                <div className="col-md-6">
                    <label className="form-label fw-semibold">No Of Diamond</label>
                    <input className="form-control" value={form.noOf_Diamonds} onChange={e => set('noOf_Diamonds', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Certificate & Delivery</div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="cert"
                    checked={form.is_Certificate_Required} onChange={e => set('is_Certificate_Required', e.target.checked)} />
                  <label className="form-check-label" htmlFor="cert">Certificate Required</label>
                </div>
                {form.is_Certificate_Required && (
                  <div className="mb-3">
                    <select className="form-select" value={form.certificate_ID} onChange={e => set('certificate_ID', e.target.value)}>
                      <option value="">Select Certificate Type</option>
                      {certTypes.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="form-label fw-semibold">Delivery Date *</label>
                  <input type="date" className={`form-control ${errors.delivery_Date ? 'is-invalid' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    value={form.delivery_Date} onChange={e => set('delivery_Date', e.target.value)} />
                  {errors.delivery_Date && <div className="invalid-feedback">{errors.delivery_Date}</div>}
                </div>
                <div>
                  <br/>
                  <div className="col-md-12">
                    <label className="form-label fw-semibold">Specifications</label>
                    <textarea className="form-control" rows={5} value={form.specification} onChange={e => set('specification', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">Reference Images</div>
              <div className="card-body">
                <div className="row g-3">
                  {['frontImage', 'topImage', 'sideImage', 'backImage'].map((f, i) => (
                    <div className="col-md-3" key={f}>
                      <ImageUpload field={f} label={['Front View', 'Top View', 'Side View', 'Back View'][i]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Placing Order...</> : 'Place Order'}
            </button>
            <button type="button" className="btn btn-secondary ms-2 px-4" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
