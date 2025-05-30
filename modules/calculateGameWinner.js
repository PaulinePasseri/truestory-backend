const mongoose = require("mongoose");
const Scenes = require("../models/scenes");
const Games = require("../models/games");

async function calculateGameWinnerByCode(gameCode) {
  try {
    const game = await Games.findOne({ code: gameCode });
    if (!game) {
      console.log("Aucun jeu trouvé avec ce code");
      return null;
    }

    const gameId = game._id;

    const result = await Scenes.aggregate([
      { $match: { game: new mongoose.Types.ObjectId(gameId) } },
      { $unwind: "$propositions" },
      {
        $group: {
          _id: "$propositions.userId",
          totalVotes: { $sum: "$propositions.votes" },
        },
      },
      { $sort: { totalVotes: -1 } },
      { $limit: 1 },
    ]);

    const winnerUserId = result[0]?._id;
    const totalVotes = result[0]?.totalVotes;

    if (!winnerUserId) {
      console.log("Aucun gagnant trouvé");
      return null;
    }

    await Games.findByIdAndUpdate(gameId, {
      winner: winnerUserId.toString(),
      totalVotes: totalVotes
    });

    console.log(`Gagnant défini pour le jeu ${gameCode} : ${winnerUserId}`);

    return { winnerUserId, totalVotes };
  } catch (error) {
    console.error("Erreur lors du calcul du gagnant :", error);
    return null;
  }
}

module.exports = { calculateGameWinnerByCode };
