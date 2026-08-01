import PDFDocument from 'pdfkit';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { Transaction, Wallet, Budget, User } from '../models/models.js';

export const exportReport = async (req, res) => {
  try {
    const { format, dateStart, dateEnd } = req.query;
    const userId = req.user.id;

    // Retrieve transactions
    let query = { userId };
    if (dateStart || dateEnd) {
      query.date = {};
      if (dateStart) query.date.$gte = dateStart;
      if (dateEnd) query.date.$lte = dateEnd;
    }

    const transactions = await Transaction.find(query);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const wallets = await Wallet.find({ userId });
    const user = await User.findById(userId);

    if (format === 'csv') {
      let csvContent = 'Date,Title,Type,Category,Amount,Payment Mode,Location,Notes\n';
      for (const t of transactions) {
        const row = `"${t.date}","${t.title.replace(/"/g, '""')}","${t.type}","${(t.category || '').replace(/"/g, '""')}",${t.amount},"${(t.paymentMode || '').replace(/"/g, '""')}","${(t.location || '').replace(/"/g, '""')}","${(t.notes || '').replace(/"/g, '""')}"\n`;
        csvContent += row;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=budgetwise_report_${Date.now()}.csv`);
      return res.send(csvContent);
    } 
    
    if (format === 'excel') {
      const wb = xlsx.utils.book_new();
      
      // Transactions Sheet
      const transData = transactions.map(t => ({
        Date: t.date,
        Title: t.title,
        Type: t.type,
        Category: t.category || '',
        Amount: t.amount,
        'Payment Mode': t.paymentMode || '',
        Location: t.location || '',
        Notes: t.notes || ''
      }));
      const wsTrans = xlsx.utils.json_to_sheet(transData);
      xlsx.utils.book_append_sheet(wb, wsTrans, 'Transactions');

      // Wallets Sheet
      const walletData = wallets.map(w => ({
        'Wallet Name': w.name,
        Type: w.type,
        Balance: w.balance
      }));
      const wsWallets = xlsx.utils.json_to_sheet(walletData);
      xlsx.utils.book_append_sheet(wb, wsWallets, 'Wallets');

      const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=budgetwise_report_${Date.now()}.xlsx`);
      return res.send(buf);
    } 
    
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=budgetwise_report_${Date.now()}.pdf`);

      doc.pipe(res);

      // Header block
      doc.fillColor('#1e1b4b').fontSize(24).text('BudgetWise AI', 50, 50);
      doc.fontSize(12).fillColor('#4b5563').text('Smart Budget Tracker & Personal Finance Manager', 50, 78);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 400, 50);
      doc.text(`User: ${user.name} (${user.email})`, 400, 68);
      doc.moveDown(2);

      // Horizontal Line
      doc.moveTo(50, 110).lineTo(560, 110).stroke('#e5e7eb');
      doc.moveDown(2);

      // Wallets Overview
      doc.fillColor('#1e1b4b').fontSize(16).text('Wallet Balances', 50, 130);
      doc.moveDown(0.5);
      let walletY = 150;
      for (const w of wallets) {
        doc.fontSize(11).fillColor('#1f2937').text(`${w.name} (${w.type}):`, 50, walletY);
        doc.fontSize(11).fillColor('#10b981').text(`₹${w.balance.toLocaleString()}`, 250, walletY);
        walletY += 18;
      }
      doc.moveDown(2);

      // Transactions list
      doc.fillColor('#1e1b4b').fontSize(16).text('Recent Transactions', 50, walletY + 20);
      
      const tableTop = walletY + 45;
      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Date', 50, tableTop);
      doc.text('Title', 130, tableTop);
      doc.text('Type', 280, tableTop);
      doc.text('Category', 340, tableTop);
      doc.text('Amount', 460, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke('#e5e7eb');

      let rowY = tableTop + 25;
      for (const t of transactions) {
        if (rowY > 700) {
          doc.addPage();
          rowY = 50; // reset rowY on new page
        }
        doc.fontSize(10).fillColor('#374151');
        doc.text(t.date, 50, rowY);
        doc.text(t.title.length > 22 ? t.title.substring(0, 20) + '..' : t.title, 130, rowY);
        
        const typeColor = t.type === 'income' ? '#10b981' : t.type === 'expense' ? '#ef4444' : '#3b82f6';
        doc.fillColor(typeColor).text(t.type.toUpperCase(), 280, rowY);
        
        doc.fillColor('#374151').text(t.category || 'Other', 340, rowY);
        doc.text(`₹${t.amount.toLocaleString()}`, 460, rowY);

        doc.moveTo(50, rowY + 15).lineTo(560, rowY + 15).stroke('#f3f4f6');
        rowY += 22;
      }

      doc.end();
      return;
    }

    res.status(400).json({ message: 'Unsupported format. Use pdf, excel, or csv.' });
  } catch (err) {
    res.status(500).json({ message: 'Error generating report.', error: err.message });
  }
};

export const importBankStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const filePath = req.file.path;
    const userId = req.user.id;

    // Read CSV using XLSX library
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Cleanup temp file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to delete temp statement upload file:', e.message);
    }

    // Default wallet for imports
    let wallet = await Wallet.findOne({ userId, type: 'bank' });
    if (!wallet) {
      wallet = await Wallet.findOne({ userId }); // fallback to any wallet
    }
    const walletId = wallet ? wallet._id : null;

    let importCount = 0;

    // Loop rows and import
    // Format expected: Date, Title, Type (income/expense), Category, Amount
    for (const row of rawData) {
      const date = row.Date || row.date || new Date().toISOString().split('T')[0];
      const title = row.Title || row.title || row.Description || row.description || 'Imported Transaction';
      const type = (row.Type || row.type || 'expense').toLowerCase();
      const category = row.Category || row.category || 'Other';
      const amount = parseFloat(row.Amount || row.amount || 0);

      if (amount <= 0 || !walletId) continue;

      // Sync wallet
      const walletDoc = await Wallet.findById(walletId);
      if (type === 'income') {
        await Wallet.findByIdAndUpdate(walletId, { balance: walletDoc.balance + amount });
      } else {
        await Wallet.findByIdAndUpdate(walletId, { balance: walletDoc.balance - amount });
      }

      await Transaction.create({
        userId,
        title,
        amount,
        type,
        category,
        date,
        paymentMode: wallet.name,
        sourceWalletId: type === 'expense' ? walletId : undefined,
        targetWalletId: type === 'income' ? walletId : undefined
      });

      importCount++;
    }

    res.status(200).json({ message: `Successfully imported ${importCount} transactions.`, count: importCount });
  } catch (err) {
    res.status(500).json({ message: 'Error importing bank statement.', error: err.message });
  }
};
