'use client';
import Image from "next/image";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { collection, deleteDoc, getDocs, query, setDoc, getDoc, doc } from "firebase/firestore";
import { Box, Button, Modal, Stack, TextField, Typography } from "@mui/material";
import { firestore } from "@/firebase";

// Dynamically import firebase storage related code
const useStorage = dynamic(() => import('./hooks/useStorage'), { ssr: false });

const InventoryModal = ({ open, handleClose, addItem, itemName, setItemName, itemImage, setItemImage }) => (
  <Modal open={open} onClose={handleClose}>
    <Box
      position={'absolute'}
      top={'50%'}
      left={'50%'}
      sx={{
        transform: 'translate(-50%, -50%)',
      }}
      width={400}
      bgcolor={'white'}
      border={'2px solid #000'}
      boxShadow={24}
      p={4}
      display={'flex'}
      flexDirection={'column'}
      gap={3}
    >
      <Typography variant="h6">Add Item</Typography>
      <Stack width={'100%'} direction={'column'} spacing={2}>
        <TextField
          variant="outlined"
          fullWidth
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
        <input type="file" onChange={(e) => setItemImage(e.target.files[0])} />
        <Button
          variant="outlined"
          onClick={() => {
            addItem(itemName, itemImage);
            setItemName('');
            setItemImage(null);
            handleClose();
          }}
        >
          Add
        </Button>
      </Stack>
    </Box>
  </Modal>
);

const InventoryItem = ({ name, quantity, imageUrl, addItem, removeItem }) => (
  <Box
    width={'100%'}
    minHeight={'150px'}
    display={'flex'}
    alignItems={'center'}
    justifyContent={'space-between'}
    padding={5}
  >
    <Typography variant="h3" color={'#333'} textAlign={'center'}>
      {name.charAt(0).toUpperCase() + name.slice(1)}
    </Typography>
    <Typography variant="h3" color={'#333'} textAlign={'center'}>
      {quantity}
    </Typography>
    {imageUrl && (
      <Image src={imageUrl} alt={`${name} image`} width={100} height={100} />
    )}
    <Stack direction={'row'} spacing={2}>
      <Button variant="contained" onClick={() => addItem(name)}>Add</Button>
      <Button variant="contained" onClick={() => removeItem(name)}>Remove</Button>
    </Stack>
  </Box>
);

const InventoryList = ({ inventory, addItem, removeItem }) => (
  <Stack width={'800px'} height={'300px'} spacing={2} overflow={'auto'}>
    {inventory.map(({ name, quantity, imageUrl }) => (
      <InventoryItem
        key={name}
        name={name}
        quantity={quantity}
        imageUrl={imageUrl}
        addItem={addItem}
        removeItem={removeItem}
      />
    ))}
  </Stack>
);

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const uploadImage = useStorage();

  const updateInventory = async () => {
    try {
      const snapshot = await getDocs(query(collection(firestore, 'inventory')));
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({
          name: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error updating inventory: ", error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item, image) => {
    const docRef = doc(firestore, 'inventory', item);
    const docSnap = await getDoc(docRef);
    let imageUrl = '';
    if (image) {
      try {
        imageUrl = await uploadImage(image);
      } catch (error) {
        console.error("Error uploading image: ", error);
      }
    }

    try {
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1, imageUrl }, { merge: true });
      } else {
        await setDoc(docRef, { quantity: 1, imageUrl });
      }
      await updateInventory();
    } catch (error) {
      console.error("Error adding item: ", error);
    }
  };

  const removeItem = async (item) => {
    const docRef = doc(firestore, 'inventory', item);
    const docSnap = await getDoc(docRef);
    try {
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
        }
        await updateInventory();
      }
    } catch (error) {
      console.error("Error removing item: ", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box display='flex' justifyContent='center' alignItems='center' textAlign={'center'} flexDirection={'column'}>
      <Box
        flexDirection={'column'}
        width='100vw'
        height='100vh'
        display='flex'
        justifyContent='center'
        alignItems='center'
        gap={2}
      >
        <Typography variant="h1">Inventory Management</Typography>
        <InventoryModal
          open={open}
          handleClose={handleClose}
          addItem={addItem}
          itemName={itemName}
          setItemName={setItemName}
          itemImage={itemImage}
          setItemImage={setItemImage}
        />
        <Typography>An interface to manage your items!</Typography>
      </Box>
      <Box display={'flex'}
        alignItems={'center'}
        justifyContent={'center'}
        flexDirection={'column'}
        border='1px solid #333'
        width='800px'
        marginbottom={'20px'}
        paddingBottom={'10px'}
      >
        <Box width={'800px'} height={'100px'} bgcolor={'#ADD8E6'} textAlign={'center'}>
          <Typography variant="h2" color={'#333'}> Inventory Items</Typography>
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search Items"
          width='50vw'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: '20px 0' }}
        />
        <InventoryList inventory={filteredInventory} addItem={addItem} removeItem={removeItem} />
        <Button variant="contained" onClick={handleOpen} marginbottom='10px'>
          Add New Item
        </Button>
      </Box>
    </Box>
  );
}
