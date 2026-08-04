import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongoConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && mongoUri.trim() !== '') {
    try {
      await mongoose.connect(mongoUri);
      isMongoConnected = true;
      console.log('MongoDB connected successfully.');
      return true;
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local JSON database.', err.message);
    }
  } else {
    console.log('No MONGO_URI specified. Using local JSON database.');
  }
  isMongoConnected = false;
  return false;
}

// Simple helper to match queries for local JSON DB
function matchesQuery(item, query) {
  if (!query) return true;
  for (const key in query) {
    const queryValue = query[key];
    const itemValue = item[key];

    if (queryValue && typeof queryValue === 'object' && !Array.isArray(queryValue)) {
      // Handle operators like $gte, $lte, $in, $ne
      for (const op in queryValue) {
        const val = queryValue[op];
        if (op === '$gte' && !(itemValue >= val)) return false;
        if (op === '$lte' && !(itemValue <= val)) return false;
        if (op === '$gt' && !(itemValue > val)) return false;
        if (op === '$lt' && !(itemValue < val)) return false;
        if (op === '$ne' && itemValue === val) return false;
        if (op === '$in') {
          if (!Array.isArray(val) || !val.includes(itemValue)) return false;
        }
      }
    } else {
      // Standard exact match
      if (itemValue !== queryValue) return false;
    }
  }
  return true;
}

class LocalModel {
  constructor(name, schemaDef) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}.json`);
    this.schemaDef = schemaDef;
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    const data = this._read();
    return data.filter(item => matchesQuery(item, query));
  }

  async findOne(query = {}) {
    const data = this._read();
    const item = data.find(item => matchesQuery(item, query));
    return item || null;
  }

  async findById(id) {
    const data = this._read();
    const item = data.find(item => item._id === id);
    return item || null;
  }

  async create(doc) {
    const data = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.push(newDoc);
    this._write(data);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const data = this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    // Support standard mongoose updates or direct sets
    const current = data[index];
    const updated = {
      ...current,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    data[index] = updated;
    this._write(data);
    return updated;
  }

  async findByIdAndDelete(id) {
    const data = this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = data[index];
    data.splice(index, 1);
    this._write(data);
    return deleted;
  }

  async updateOne(query, updateData) {
    const data = this._read();
    const index = data.findIndex(item => matchesQuery(item, query));
    if (index === -1) return { nModified: 0 };
    data[index] = { ...data[index], ...updateData, updatedAt: new Date().toISOString() };
    this._write(data);
    return { nModified: 1 };
  }

  async deleteOne(query) {
    const data = this._read();
    const index = data.findIndex(item => matchesQuery(item, query));
    if (index === -1) return { deletedCount: 0 };
    data.splice(index, 1);
    this._write(data);
    return { deletedCount: 1 };
  }

  async countDocuments(query = {}) {
    const data = this._read();
    return data.filter(item => matchesQuery(item, query)).length;
  }
}

export function defineModel(name, schemaDef) {
  // Return a proxy that directs requests to Mongoose if connected, or Local DB if not
  const localModelInstance = new LocalModel(name, schemaDef);
  
  // We lazily build the Mongoose model so that it doesn't fail if we don't have a Mongo connection
  let mongooseModel = null;
  const getMongooseModel = () => {
    if (!mongooseModel && isMongoConnected) {
      // Define schema using mongoose, forcing _id to be String type to match local JSON DB keys
      const schema = new mongoose.Schema({
        _id: { type: String },
        ...schemaDef
      }, { timestamps: true });
      mongooseModel = mongoose.model(name, schema);
    }
    return mongooseModel;
  };

  return {
    find: async (query) => {
      const model = getMongooseModel();
      if (model) return model.find(query).lean();
      return localModelInstance.find(query);
    },
    findOne: async (query) => {
      const model = getMongooseModel();
      if (model) return model.findOne(query).lean();
      return localModelInstance.findOne(query);
    },
    findById: async (id) => {
      const model = getMongooseModel();
      if (model) return model.findById(id).lean();
      return localModelInstance.findById(id);
    },
    create: async (doc) => {
      const model = getMongooseModel();
      if (model) return (await model.create(doc)).toObject();
      return localModelInstance.create(doc);
    },
    findByIdAndUpdate: async (id, updateData, options = {}) => {
      const model = getMongooseModel();
      if (model) return model.findByIdAndUpdate(id, updateData, { new: true, ...options }).lean();
      return localModelInstance.findByIdAndUpdate(id, updateData, options);
    },
    findByIdAndDelete: async (id) => {
      const model = getMongooseModel();
      if (model) return model.findByIdAndDelete(id).lean();
      return localModelInstance.findByIdAndDelete(id);
    },
    updateOne: async (query, updateData) => {
      const model = getMongooseModel();
      if (model) return model.updateOne(query, updateData);
      return localModelInstance.updateOne(query, updateData);
    },
    deleteOne: async (query) => {
      const model = getMongooseModel();
      if (model) return model.deleteOne(query);
      return localModelInstance.deleteOne(query);
    },
    countDocuments: async (query) => {
      const model = getMongooseModel();
      if (model) return model.countDocuments(query);
      return localModelInstance.countDocuments(query);
    }
  };
}
