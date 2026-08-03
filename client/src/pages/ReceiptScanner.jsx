import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Check, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  FileImage,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Food', 'Shopping', 'Travel', 'Education', 'Medical', 'Fuel', 'Bills', 'Rent', 'Investment', 'Entertainment', 'Other'
];

export default function ReceiptScanner({ refresh }) {
  const navigate = useNavigate();
  const { wallets } = useSelector(state => state.finance);
  
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  
  // Scanned form approval states
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: '',
    sourceWalletId: '',
    gst: 0
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setScannedData(null);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await axios.post('/api/ai/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setScannedData(res.data);
      setForm({
        title: res.data.storeName || 'Store Receipt',
        amount: res.data.amount || '',
        category: 'Food', // default to Food or we can run autoguess logic
        date: res.data.date || new Date().toISOString().split('T')[0],
        sourceWalletId: wallets[0]?._id || '',
        gst: res.data.gst || 0
      });
    } catch (err) {
      alert('OCR Scanning failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setScanning(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transactions', {
        title: form.title,
        amount: parseFloat(form.amount),
        type: 'expense',
        category: form.category,
        date: form.date,
        sourceWalletId: form.sourceWalletId,
        paymentMode: wallets.find(w => w._id === form.sourceWalletId)?.name || 'Wallet',
        notes: `Extracted via OCR Scanner. GST component: ₹${form.gst}`
      });

      alert('Transaction logged successfully from scanned receipt!');
      // Reset scanner
      setFile(null);
      setImagePreview(null);
      setScannedData(null);
      if (refresh) refresh();
      navigate('/transactions');
    } catch (err) {
      alert('Failed to log scanned transaction: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="page-title">
          AI Receipt OCR Scanner
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload receipt photos. Our built-in OCR scans merchant, total amounts, GST figures, and auto-fills logs.
        </p>
      </div>

      {/* Main Grid: Upload Area vs Scanned Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Upload panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-base font-bold text-white">Upload Receipt Image</h3>
          
          <div className="relative border-2 border-dashed border-white/10 hover:border-brand-purple/40 rounded-2xl p-8 text-center cursor-pointer transition-all">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {imagePreview ? (
              <div className="relative group max-h-64 overflow-hidden rounded-lg">
                <img src={imagePreview} alt="Receipt Preview" className="mx-auto max-h-60 object-contain rounded" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white font-bold bg-slate-900/80 px-3 py-1.5 rounded-lg">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 rounded-full w-fit mx-auto border border-white/5">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-300 block">Drag & Drop or Click to Upload</span>
                <span className="text-[10px] text-gray-500 block">Supports JPG, PNG, WebP up to 5MB</span>
              </div>
            )}
          </div>

          {file && !scanning && !scannedData && (
            <button
              onClick={handleScan}
              className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Perform OCR Scan
            </button>
          )}

          {scanning && (
            <div className="space-y-4">
              {/* Neon glow scan effect */}
              <div className="relative h-60 w-full overflow-hidden rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center">
                {imagePreview && (
                  <img src={imagePreview} alt="Scanning" className="h-full w-full object-contain opacity-50" />
                )}
                {/* Neon line scan animation */}
                <motion.div 
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-rose shadow-[0_0_10px_#7c3aed]"
                />
                <div className="absolute flex items-center gap-2 bg-slate-900/80 border border-white/10 px-4 py-2 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-purple" />
                  <span className="text-xs font-bold text-white">Extracting text fields...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: OCR Results / Form approval */}
        <div className="glass-panel p-6 rounded-3xl h-fit">
          <h3 className="text-base font-bold text-white mb-4">Verification Form</h3>
          
          {!scannedData ? (
            <div className="text-center py-16 space-y-2">
              <FileImage className="h-10 w-10 text-gray-600 mx-auto" />
              <span className="text-xs text-gray-500 font-bold block">No active scan active</span>
              <span className="text-[10px] text-gray-500 max-w-xs mx-auto block leading-normal">
                Upload a receipt image and press "Perform OCR Scan" to view auto-filled parameters.
              </span>
            </div>
          ) : (
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2.5 mb-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-400 leading-normal">
                  OCR complete. We found candidate matches. Please review details below before logging.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Merchant Store</label>
                <input 
                  type="text" required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Total Amount (₹)</label>
                  <input 
                    type="number" required
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">GST/Tax component (₹)</label>
                  <input 
                    type="number"
                    value={form.gst}
                    onChange={e => setForm({ ...form, gst: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date</label>
                  <input 
                    type="date" required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Funding Wallet</label>
                <select 
                  required
                  value={form.sourceWalletId}
                  onChange={e => setForm({ ...form, sourceWalletId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select funding wallet</option>
                  {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                Approve & Log Transaction <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
