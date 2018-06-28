'use strict';
const opCont = require (__dirname + '/operationController');
const db = require( __dirname + '/../models/' );


module.exports.getVotes = async () => {

};



module.exports.evalVotes = async ( oId ) => {
  const votes = await db.Vote.findAll({ where:
    {operation_id: oId},
  attributes: ['value','userwallet_id']
  });
  let allVotes = votes.length;
  let howManyVotes = 0;
  let howManyOK = 0;
  for (let vote of votes) {
    if (vote.dataValues.value) {
      howManyVotes++;
      if ( vote.dataValues.value === 1) howManyOK++;
    }
  }
  if ( howManyVotes === allVotes) {
    if ( allVotes === howManyOK ) await opCont.executeOperation( oId, votes );
    else await opCont.rejectOperation( oId, votes );
  }
};



module.exports.vote = async (ctx) => {
  if (ctx.request.body.valueOfvote !== 1 && ctx.request.body.valueOfvote !== 2) return ctx.body = {error: 'Value of the vote invalid'};
  //get userAuth Id
  const userId = await db.User.findOne({ where:
    { username:ctx.user.username},
  attributes: ['id']
  });

  //get userWallet id
  const userWalletId = await db.UserWallet.findOne({ where:
    { user_id: userId.id, wallet_id: ctx.request.body.publicKey},
  attributes: ['id']
  });
  if (!userWalletId) return ctx.body = {error: 'User has no rights ver this wallet'};

  const vote = await db.Vote.findOne({ where:
    {userwallet_id:userWalletId.id, operation_id: ctx.request.body.operation_id}
  });
  if(!vote) return ctx.body = {error: 'User has not rights over this operation'};
  if(vote.dataValues.value) return ctx.body = {error: 'User has already voted'};

  const result = await vote.updateAttributes({
    value: ctx.request.body.valueOfvote
  });
  if(!result) return ctx.body = {error: 'DB error on updating'};

  ctx.body = {'operation_id':ctx.request.body.operation_id};

  this.evalVotes(ctx.request.body.operation_id);
};