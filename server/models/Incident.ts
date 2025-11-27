import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
    id: string;
    type: 'theft' | 'assault' | 'harassment' | 'accident' | 'suspicious' | 'other';
    latitude: number;
    longitude: number;
    description: string;
    address?: string;
    timestamp: Date;
    verified: boolean;
    reporterId: string;
    upvotes: number;
}

const IncidentSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    description: { type: String, required: true },
    address: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    reporterId: { type: String, required: true },
    upvotes: { type: Number, default: 0 }
});

export default mongoose.model<IIncident>('Incident', IncidentSchema);
