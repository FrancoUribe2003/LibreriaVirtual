import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const options = {};

// Tipar el global para evitar 'any'
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Por favor define la variable de entorno MONGODB_URI");
}

if (process.env.NODE_ENV === "development") {
  // En desarrollo, usa una variable global para evitar múltiples conexiones
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, crea una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;