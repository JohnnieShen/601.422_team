# Team-SuperSurveyors
#### [Deployment Link](https://jhu-oose-f24.github.io/Team-SuperSurveyors/)

## Team Members (Github Username)
* Larry Cai (larrythelog)
* Jianwei Chen (jchen362)
* Mia Jin (zhengyue4499)
* Noah Park (noahpark101)
* Xin Tan (tanx3036)
* Jiayi Zhang (jiayizhang-evelynn)

## Instructions
`npm` is required to run this web app.
1. Run `npm install`
1. Run `npm run start`

## About
Our app is a survey platform where people will be able to create their own serveys as well as do other people's surveys. We would like to foster an environment where users are incentivized to try other people's surveys so that their own surveys are advertised to other people. We'd also like to increase convenience of exposing these surveys to people around the world so that the survey creators can obtain all sorts of perspectives and audiences. This is not possible in traditional methods and mainstream survey apps.

## Iteration 1 Features
* Users can create a survey with a collection of different types of questions (will create unique user functionality and authentication in future iteration)
* Users can view all the surveys created
* Basic Firebase Firestore setup (works in the frontend, will be put in the backend in a future iteration.)

## Iteration 2 Features
* User authentication implemented. Entire backbone of `user` document storage in Firebase along with helper functions for Firebase related actions such as viewing survey results and  updating profile information.
* Profile page implemented. We acknowledge the recommendation to do this feature in a later iteration, but we strongly believed that this functionality needed to be developed for the future need-to-have features (data visualization, recommendation algorithm, etc.). We also consulted with Yoohyuk beforehand, and he agreed that our iteration could be this "setting up" since all the other crucial features required this set up beforehand.
* Basic survey results dialog screen, providing the survey creator with all the responses made to their survey.

## Iteration 3 Features
* Tagging feature implemented. This was applied to both users and surveys. For the time being, it is a fixed set of categories that can be selected. We plan on adding more or making it dynamic.
* User onboarding page implemented. This makes use of the tagging feature and guides the user on the kinds of surveys they want to answer. 
* Users can now edit their own previously created surveys, and see results of responses.
* The survey answering feature has received a lot of improvements. Fetching a survey is now randomized, but also makes use of a priority queue of surveys that gives surveys a calculated score. 

## Iteration 4 Features
* We've deployed our app on Github Pages. The link to the deployment is at the top of this README.
* The UI for our website has been completely overhauled. We now use Material UI for all of our frontend needs. Some pages are still using the original React Bootstrap so we will convert the UI in the next iteration. To better guide users, we also created a landing page where they can see what we have to offer before creating an account. 
* Users can now login with their Google account. If they previously had an account through the original Username/Password authentication then login with their Google account, they must login with Google for all future visits.
* Trending Page implemented. It shows the 10 most popular surveys being answered, and allows the user to see the results for these surveys. 
* Coin currency system implemented. A user's coin balance is shown in the NavBar. The balance will increment from answering other people's surveys and decrement from creating surveys. We hope this will users an incentive to be active with other users.
* The Answer Surveys page had some issues last iteration like a user being able to reanswer surveys and glitches with multiple-select questions.

## Iteration 5 Features
* Survey Results Visualization has been improved. Cleaned up the UI and added graphs for the multiple choice and multiselect questions.
* Audio and Video input
* Navbar UI has been improved
