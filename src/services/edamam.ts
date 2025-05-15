interface EdamamFood {
  foodId: string;
  label: string;
  nutrients: {
    ENERC_KCAL: number;
    PROCNT: number;
    CHOCDF: number;
    FAT: number;
  };
  servingSize: number;
  servingUnit: string;
}

interface EdamamResponse {
  hints: Array<{
    food: EdamamFood;
  }>;
}

const EDAMAM_APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID!;
const EDAMAM_APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY!;
const EDAMAM_API_URL = 'https://api.edamam.com/api/food-database/v2/parser';

export const searchFood = async (query: string): Promise<EdamamFood[]> => {
  try {
    const response = await fetch(
      `${EDAMAM_API_URL}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch food data');
    }

    const data: EdamamResponse = await response.json();
    return data.hints.map(hint => hint.food);
  } catch (error) {
    console.error('Error searching food:', error);
    throw error;
  }
};

export const getFoodDetails = async (foodId: string): Promise<EdamamFood> => {
  try {
    const response = await fetch(
      `${EDAMAM_API_URL}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&foodId=${foodId}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch food details');
    }

    const data: EdamamResponse = await response.json();
    return data.hints[0].food;
  } catch (error) {
    console.error('Error getting food details:', error);
    throw error;
  }
};

export const calculateNutrition = (
  food: EdamamFood,
  servingSize: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} => {
  const ratio = servingSize / food.servingSize;
  return {
    calories: Math.round(food.nutrients.ENERC_KCAL * ratio),
    protein: Math.round(food.nutrients.PROCNT * ratio * 10) / 10,
    carbs: Math.round(food.nutrients.CHOCDF * ratio * 10) / 10,
    fats: Math.round(food.nutrients.FAT * ratio * 10) / 10,
  };
}; 