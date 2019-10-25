// Global app controller
import axios from 'axios';
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Like'
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView'
import {elements, renderLoader, clearLoader} from './views/base';
/** Global state of the app
    Search object
    Current recipe object
    shopping list object
    liked recipes
 */
const state = {};

// Search controller

const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput();
    //const query = 'pizza';
    if(query) {
        // 2) New search object and adds to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        // 4) Search for recipes
        await state.search.getResults();

        // 5) Render results on UI
        //console.log(state.search.result);
        clearLoader();
        searchView.renderResults(state.search.result);

    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    //console.log(btn);
    if(btn) {
        searchView.clearResults();
        const gotoPage = parseInt(btn.dataset.goto, 10);
        searchView.renderResults(state.search.result, gotoPage);
    }
});


// Recipe controller


const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');

    if(id) {
        // Prepare UI firstly
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        if(state.search)searchView.highlightSelected(id);
        state.recipe = new Recipe(id);
        try {
            // Get recipe data
            await state.recipe.getRecipe();
            
            // Calculate servings and time
            state.recipe.parseIngredients();

            state.recipe.calcTime();
            state.recipe.calcServings();
            
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id) 
            );


        } catch(err) {
            console.log(err);
            alert('Error processing recipe');
        }
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // add ingredients to shopping list
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller
        controlLikes();
    }
});


// List controller
const controlList = () => {
    // create a new list if there is none yet
    if(!state.list) state.list = new List();

    // add each ingredients to the list and UI
    state.recipe.Ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    // handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id);
        listView.deleteItem(id);
    } else if(e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// like controller
const controlLikes = () => {
    // if (!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    // user hasn't liked the current recipe
    if(!state.likes.isLiked(currentId)) {
        // Add like to the state
        const newLike = state.likes.addLike(currentId, state.recipe.title, state.recipe.author
        , state.recipe.img);
        // Toggle the like button
        likeView.toggleLikeBtn(true);
        // add like to UI list
        likeView.renderLike(newLike);
        console.log(state.likes);
    // user has liked the current recipe
    }else {
        // Remove item from the state
        state.likes.deleteLike(currentId);
        // Toggle the like button
        likeView.toggleLikeBtn(false);
        // Remove like from UI list
        likeView.deleteLike(currentId);
        console.log(state.likes);

    }
    likeView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes when page loads
window.addEventListener('load', () => {
    if (!state.likes) state.likes = new Likes();
    
    // restore likes
    state.likes.readStorage();
    
    // toggle like menu button
    likeView.toggleLikeMenu(state.likes.getNumLikes());

    // render existing likes
    state.likes.likes.forEach(like => likeView.renderLike(like));
});
