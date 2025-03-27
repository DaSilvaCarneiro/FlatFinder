import { db } from './config/firebase'; // Import Firebase configuration
import { collection, addDoc } from 'firebase/firestore';


const flats = [
    { title: "Estúdio Moderno", price: "900", area: "40", city: "Lisboa", ownerName: "João Silva", ownerEmail: "joao.silva@gmail.com" },
    { title: "Apartamento Charmoso", price: "1200", area: "70", city: "Porto", ownerName: "Maria Oliveira", ownerEmail: "maria.oliveira@yahoo.com" },
    { title: "Apartamento de Luxo", price: "2500", area: "120", city: "Faro", ownerName: "José Costa", ownerEmail: "jose.costa@hotmail.com" },
    { title: "Apartamento Frente Mar", price: "2200", area: "100", city: "Cascais", ownerName: "Ana Pereira", ownerEmail: "ana.pereira@aol.com" },
    { title: "Apartamento Aconchegante", price: "600", area: "50", city: "Aveiro", ownerName: "Carlos Mendes", ownerEmail: "carlos.mendes@gmail.com" },
    { title: "Apartamento Espaçoso", price: "1300", area: "110", city: "Coimbra", ownerName: "Teresa Santos", ownerEmail: "teresa.santos@gmail.com" },
    { title: "Apartamento Moderno", price: "1500", area: "80", city: "Sintra", ownerName: "Pedro Rocha", ownerEmail: "pedro.rocha@hotmail.com" },
    { title: "Apartamento Renovado", price: "1000", area: "90", city: "Braga", ownerName: "Sofia Ribeiro", ownerEmail: "sofia.ribeiro@outlook.com" },
    { title: "Apartamento Espaçoso", price: "2500", area: "150", city: "Lisboa", ownerName: "Rui Martins", ownerEmail: "rui.martins@gmail.com" },
    { title: "Penthouse", price: "1600", area: "95", city: "Porto", ownerName: "Sandra Gomes", ownerEmail: "sandra.gomes@live.com" },
    { title: "Apartamento com Vista Mar", price: "1800", area: "110", city: "Lagos", ownerName: "Miguel Santos", ownerEmail: "miguel.santos@gmail.com" },
    { title: "Apartamento Compacto", price: "750", area: "45", city: "Ponta Delgada", ownerName: "João Almeida", ownerEmail: "joao.almeida@outlook.com" },
    { title: "Duplex", price: "1350", area: "125", city: "Vila Real", ownerName: "Luís Silva", ownerEmail: "luis.silva@gmail.com" },
    { title: "Apartamento de Luxo", price: "3000", area: "160", city: "Madeira", ownerName: "Beatriz Oliveira", ownerEmail: "beatriz.oliveira@yahoo.com" },
    { title: "Estúdio", price: "800", area: "40", city: "Funchal", ownerName: "Pedro Costa", ownerEmail: "pedro.costa@aol.com" },
    { title: "Apartamento Elegante", price: "950", area: "80", city: "Évora", ownerName: "Rita Pinto", ownerEmail: "rita.pinto@gmail.com" },
    { title: "Casa Rural", price: "600", area: "70", city: "Alentejo", ownerName: "Miguel Fernandes", ownerEmail: "miguel.fernandes@hotmail.com" },
    { title: "Moradia Moderna", price: "2200", area: "130", city: "Madeira", ownerName: "Mariana Sousa", ownerEmail: "mariana.sousa@gmail.com" },
    { title: "Casa Tradicional", price: "2000", area: "100", city: "Sintra", ownerName: "Helena Carvalho", ownerEmail: "helena.carvalho@live.com" },
    { title: "Moradia de Luxo", price: "3500", area: "250", city: "Lisboa", ownerName: "João Costa", ownerEmail: "joao.costa@gmail.com" },
    { title: "Apartamento Aconchegante", price: "900", area: "60", city: "Almada", ownerName: "Ana Martins", ownerEmail: "ana.martins@aol.com" },
    { title: "Apartamento Moderno", price: "1100", area: "85", city: "Setúbal", ownerName: "Luís Oliveira", ownerEmail: "luis.oliveira@hotmail.com" },
    { title: "Moradia", price: "2200", area: "140", city: "Cascais", ownerName: "Teresa Silva", ownerEmail: "teresa.silva@gmail.com" },
    { title: "Apartamento Luminoso", price: "1000", area: "80", city: "Oeiras", ownerName: "Bruno Rocha", ownerEmail: "bruno.rocha@outlook.com" },
    { title: "Apartamento com Vista Montanha", price: "1300", area: "90", city: "Serra da Estrela", ownerName: "Marta Ferreira", ownerEmail: "marta.ferreira@aol.com" },
    { title: "Apartamento Contemporâneo", price: "1400", area: "95", city: "Porto", ownerName: "Hugo Lima", ownerEmail: "hugo.lima@gmail.com" },
    { title: "Casa Aconchegante", price: "1500", area: "110", city: "Albufeira", ownerName: "Patrícia Souza", ownerEmail: "patricia.souza@yahoo.com" },
    { title: "Apartamento Espaçoso", price: "2500", area: "180", city: "Porto", ownerName: "Fábio Oliveira", ownerEmail: "fabio.oliveira@live.com" },
    { title: "Penthouse", price: "3500", area: "220", city: "Lisboa", ownerName: "João Pereira", ownerEmail: "joao.pereira@gmail.com" },
    { title: "Apartamento Moderno", price: "1100", area: "85", city: "Algarve", ownerName: "Sofia Costa", ownerEmail: "sofia.costa@hotmail.com" }
];



const AddFlatsComponent = () => {
    const addFlatsToFirestore = async () => {
        const flatsCollection = collection(db, 'flats');  // Access the 'flats' collection
        try {
            for (const flat of flats) {
                await addDoc(flatsCollection, flat);
                console.log(`Added flat: ${flat.title}`);
            }
            alert("All flats added successfully!");
        } catch (error: unknown) {
            // Type assertion to Error
            if (error instanceof Error) {
                console.error("Error adding flats: ", error.message);
                alert("Error adding flats: " + error.message);
            } else {
                console.error("An unknown error occurred");
                alert("An unknown error occurred");
            }
        }
    };
    

    return (
        <div>
            <button onClick={addFlatsToFirestore}>Add Flats to Firestore</button>
        </div>
    );
};

export default AddFlatsComponent;