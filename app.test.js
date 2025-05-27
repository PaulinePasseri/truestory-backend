const request = require("supertest");
const app = require("./app");

// Test route get /games/game/:code
it("GET /games/game/MOXHF", async () => {
  const res = await request(app).get("/games/game/MOXHF");

  expect(res.statusCode).toBe(200);
  expect(res.body.game).toEqual({
    _id: "68348d6f83f06f5e3751e371",
    status: true,
    code: "MOXHF",
    title: "Ville",
    image:
      "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747834158/science-fiction_gniu4v.png",
    genre: "Action",
    nbPlayers: 3,
    nbScenes: 8,
    winner: null,
    usersId: ["682d9a48b818070dd37cdd60"],
    __v: 0,
  });
});

// Route de récupération des parties d'un utilisateur via le token
// it("GET games/user/aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF", async () => {
//   const res = await request(app).get(
//     "games/user/aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF"
//   );

//   expect(res.statusCode).toBe(200);
//   expect(res.body.games).toEqual(
//     expect.arrayContaining([
//       {
//         _id: "68348af699126e91d97b0a12",
//         status: true,
//         code: "WCQHY",
//         title: "John",
//         image:
//           "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747834158/chapeau-de-cowboy_d1bafb.png",
//         genre: "Aventure",
//         nbPlayers: 4,
//         nbScenes: 12,
//         winner: null,
//         usersId: [
//           {
//             _id: "68345d3c25a8496e9ff5d87b",
//             email: "lion@gmail.com",
//             token: "aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF",
//             password:
//               "$2b$10$RWUjncJWMaLc7HN4g8u..ONXXPLomVt190RR2G7JK725.9gHfWsPK",
//             nickname: "Lion",
//             avatar:
//               "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747751160/witch_mt3j0o.png",
//             __v: 0,
//           },
//         ],
//         __v: 0,
//       },
//     ])
//   );
// });
