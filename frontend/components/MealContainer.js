import { FlatList, useWindowDimensions } from 'react-native'
import React from 'react'
import BudgetVersionModal from './BudgetVersionModal'
import MealCard from './MealCard'


// MealCard moved to components/MealCard.js

const MealContainer = ({ budget, searchQuery }) => {
  // Inline sample data
  const meals = [
    {
      id: 1,
      name: "Chicken Afritada",
      desc: "A classic Filipino chicken stew with potatoes, carrots, and bell peppers in a tomato-based sauce.",
      img: require("../assets/images/chicken-afritada.png"),
      imgKey: 'chicken-afritada',
      price: 200,
      // Sample video metadata for display in MealView
      videoUrl: 'https://www.youtube.com/watch?v=bYMV36YRC2U',
      videoThumbnail: 'https://img.youtube.com/vi/bYMV36YRC2U/hqdefault.jpg',
      videoTitle: 'Chicken Afritada Tutorial',
      videoAuthor: 'YouTube',
      ingredients: [
        "1 Whole Chicken",
        "3 Potatoes",
        "2 Carrots",
        "2 Bell peppers",
        "1 Tomato sauce",
        "2 Onion",
        "1 Garlic",
        "Salt & pepper",
      ],
      procedures: [
        "Season chicken with salt and pepper.",
        "Sauté garlic and onions; brown chicken pieces.",
        "Add tomato sauce, potatoes, carrots, and bell peppers.",
        "Simmer until chicken is tender and sauce thickens.",
        "Adjust seasoning and serve warm.",
      ],
    },
    {
      id: 2,
      name: "Fried Bangus",
      desc: "Crispy fried milkfish served with a side of vinegar dipping sauce.",
      img: require("../assets/images/fried-bangus.png"),
      imgKey: 'fried-bangus',
      price: 280,
      ingredients: [
        "Bangus (milkfish)",
        "Salt & pepper",
        "Garlic",
        "Cooking oil",
        "Vinegar dip",
      ],
      procedures: [
        "Clean and pat dry the bangus.",
        "Season with salt, pepper, and garlic.",
        "Heat oil and fry bangus until golden and crispy.",
        "Drain excess oil on paper towels.",
        "Serve with vinegar dipping sauce.",
      ],
    },
    {
      id: 3,
      name: "Pork Adobo",
      desc: "Tender pork marinated and simmered in soy sauce, vinegar, garlic, and spices.",
      img: require("../assets/images/pork-adobo.png"),
      imgKey: 'pork-adobo',
      price: 250,
      ingredients: [
        "Pork",
        "Soy sauce",
        "Vinegar",
        "Garlic",
        "Bay leaves",
        "Pepper",
        "Sugar (optional)",
      ],
      procedures: [
        "Combine pork, soy sauce, vinegar, garlic, bay leaves, and pepper.",
        "Marinate for at least 30 minutes.",
        "Simmer until pork is tender and sauce reduces.",
        "Adjust seasoning and add a pinch of sugar if desired.",
        "Serve with steamed rice.",
      ],
    },
    {
      id: 4,
      name: "Beef Mechado",
      desc: "Beef stew cooked with tomatoes, potatoes, and carrots in a rich sauce.",
      img: require("../assets/images/beef-mechado.png"),
      imgKey: 'beef-mechado',
      price: 350,
      ingredients: [
        "Beef",
        "Tomato sauce",
        "Potatoes",
        "Carrots",
        "Garlic & onion",
        "Salt & pepper",
      ],
      procedures: [
        "Brown beef in hot oil; set aside.",
        "Sauté garlic and onions; add tomato sauce.",
        "Return beef; add potatoes and carrots.",
        "Simmer until beef is tender and sauce thickens.",
        "Season to taste and serve.",
      ],
    },
    {
      id: 5,
      name: "Lumpiang Shanghai",
      desc: "Crispy fried spring rolls filled with ground pork and vegetables.",
      img: require("../assets/images/lumpiang-shanghai.png"),
      imgKey: 'lumpiang-shanghai',
      price: 310,
      ingredients: [
        "Ground pork",
        "Carrots",
        "Onions",
        "Garlic",
        "Spring roll wrappers",
        "Salt & pepper",
        "Sweet chili sauce",
      ],
      procedures: [
        "Mix ground pork with carrots, onions, garlic, and seasoning.",
        "Wrap mixture in spring roll wrappers.",
        "Seal edges and fry until golden brown.",
        "Drain excess oil and serve with sweet chili sauce.",
        "Enjoy while hot and crispy.",
      ],
    },
  ];

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');

  // Determine number of columns based on screen width
  const { width } = useWindowDimensions();
  const cols = width < 360 ? 1 : width < 768 ? 2 : 3;

  const filteredMeals = meals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async (item) => {
    setModalVisible(true);
    setLoading(true);
    setErrorText('');
    try {
      const text = await generateBudgetVersion({
        name: item.name,
        desc: item.desc,
        price: item.price,
        budget,
        ingredients: item.ingredients || [],
        procedures: item.procedures || [],
      });
      setModalContent(text);
    } catch (err) {
      setErrorText(err?.message || 'Failed to generate.');
    } finally {
      setLoading(false);
    }
  };

  const renderMeal = ({ item, index }) => (
    <MealCard
      item={item}
      index={index}
      budget={budget}
      cols={cols}
      onGenerate={() => handleGenerate(item)}
    />
  );

  return (
    <>
      <FlatList
        data={filteredMeals}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id.toString()}
        numColumns={cols}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 2,
          paddingBottom: 4,
        }}
        columnWrapperStyle={cols > 1 ? { justifyContent: 'flex-start', gap: 8 } : undefined}
      />
      <BudgetVersionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loading={loading}
        errorText={errorText}
        content={modalContent}
      />
    </>
  )
}

export default MealContainer