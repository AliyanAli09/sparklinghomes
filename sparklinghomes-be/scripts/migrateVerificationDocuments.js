import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateVerificationDocuments = async () => {
  try {
    const db = mongoose.connection.db;
    const moversCollection = db.collection('movers');
    
    // Find all movers with verificationDocuments
    const movers = await moversCollection.find({
      verificationDocuments: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${movers.length} movers with verificationDocuments`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const mover of movers) {
      let needsUpdate = false;
      const newDocuments = [];
      
      for (const doc of mover.verificationDocuments) {
        // Check if document is in old string format
        if (typeof doc === 'string') {
          // Convert old string format to new object format
          newDocuments.push({
            url: doc,
            publicId: `migrated_${mover._id}_${Date.now()}`,
            documentType: 'other', // Default type for migrated documents
            description: 'Migrated from old format',
            uploadedAt: new Date()
          });
          needsUpdate = true;
        } else if (doc && typeof doc === 'object') {
          // Check if document has the old 'type' field instead of 'url'
          if (doc.type && !doc.url) {
            newDocuments.push({
              url: doc.type,
              publicId: doc.publicId || `migrated_${mover._id}_${Date.now()}`,
              documentType: doc.documentType || 'other',
              description: doc.description || '',
              uploadedAt: doc.uploadedAt || new Date()
            });
            needsUpdate = true;
          } else if (doc.url) {
            // Document is already in new format
            newDocuments.push(doc);
          }
        }
      }
      
      if (needsUpdate) {
        await moversCollection.updateOne(
          { _id: mover._id },
          { $set: { verificationDocuments: newDocuments } }
        );
        migratedCount++;
        console.log(`Migrated mover ${mover._id}`);
      } else {
        skippedCount++;
      }
    }
    
    console.log(`Migration completed: ${migratedCount} movers updated, ${skippedCount} skipped`);
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateVerificationDocuments();
    console.log('Migration script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
};

main();
