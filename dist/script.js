let commentArr2 = new Array();
const dummyUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];

const defaultLoad = () => {
  let commentsString = localStorage.getItem('commentArr2');
  if (commentsString !== null) {
    commentArr2 = JSON.parse(commentsString);
    for (let i = 0; i < commentArr2.length; i++) {
      commentArr2[i].lastUpdated = new Date(commentArr2[i].lastUpdated); // converting to Date Object
      commentArr2[i].upvotes = parseInt(commentArr2[i].upvotes); // Converting string to Int
      commentArr2[i].downvotes = parseInt(commentArr2[i].downvotes); // Converting string to Int
      commentArr2[i].childrenIds = JSON.parse(commentArr2[i].childrenIds); // converting string back to array form
    }
  }
};

defaultLoad(); // FetchcommentArr2(if exists) from localstorage

document.addEventListener('DOMContentLoaded', () => {
  if (commentArr2.length) renderComments();

  // Thread Input
  const commentInput = document.getElementById('comment');
  commentInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' && commentInput.value != '') {
      let content = commentInput.value;
      let name = dummyUsers[Math.floor(Math.random() * 5)];
      addComment(name, content, null);
      commentInput.value = '';
    }
  });

  // Listening to clicks on upvotes, downvotes and reply
  const commentsList = document.getElementById('commentsList');

  commentsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('clickable')) {
      let parts = e.target.id.split('-');
      let type = parts[0];
      let id = parts[parts.length - 1];

      // For reverse Chronology
      id = commentArr2.length - parseInt(id) - 1;

      commentArr2[id][type]++;
      renderComments();
      storeComments();
    }

    if (e.target.classList.contains('reply')) {
      let parts = e.target.id.split('-');
      let id = parts[parts.length - 1];
      let inputElem = `
					<li id="input-${id}">
					  <div>
					  	<input id="content-${id}" class="comment-box" placeholder="Reply to discussion...."></ input>
					  </div>
					</li>
					`;

      let childListElemId = `childlist-${id}`;
      let childListElem = document.getElementById(childListElemId);

      if (childListElem == null) {
        childListElem = `<ul id="childlist-${id}"> ${inputElem} </ul>`;
        document.getElementById(`comment-${id}`).innerHTML += childListElem;
      } else {
        childListElem.innerHTML = inputElem + childListElem.innerHTML;
      }

      // Added to get text input en+ter to replace add button
      const replyInput = document.getElementById(`content-${id}`);
      replyInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' && replyInput.value != '') {
          let content = replyInput.value;
          let name = dummyUsers[Math.floor(Math.random() * 5)];
          addComment(name, content, id);
        }
      });
    }
  });
});

// Storing in local storage
let storeComments = () => {
  // Storing comments in stringified array in local storage
  let val = '[';
  for (let i in commentArr2) {
    val += Comment.toJSONString(commentArr2[i]);
    i != commentArr2.length - 1 ? (val += ',') : (val += '');
  }
  val += ']';
  localStorage.setItem('commentArr2', val);
};

let renderComment = (comment) => {
  let id = comment.id;
  let cumVotes = comment.upvotes - comment.downvotes;
  let listElem = `
			<li id="comment-${id}" style="max-width:600px;">
		 	<div class="comment-header">
				<div  class="comment-handle">
					${comment.name}
				</div>
				<div style="color:rgba(0,0,0,0.3);margin-top:10px;">
					${timeAgo(comment.lastUpdated)}
				</div>
			</div> 
			<div>
			 ${comment.content}
			</div>
			<div>
				${comment.upvotes}<span role="button" class="clickable" id="upvotes-${id}">&and;   </span>
				${comment.downvotes}<span  role="button" class="clickable" id="downvotes-${id}">&or;   </span>
				${cumVotes}&#9733;  
				<span role="button" class="reply" id="reply-${id}"> reply </span>
			</div>`;
  if (comment.childrenIds.length != 0) {
    listElem += `<ul id="childlist-${id}">`;

    comment.childrenIds.forEach((childrenId) => {
      commentArr2.forEach((comment, index) => {
        if (comment.id == childrenId) {
          listElem += renderComment(commentArr2[index]);
          return;
        }
      });

      // listElem += renderComment(commentArr2[commentId]);
    });
    listElem += '</ul>';
  }
  listElem += '</li>';
  // console.log(comment.timeValue);
  return listElem;
};

// Pass parent comment from rootComments to renderComment
let renderComments = () => {
  let rootComments = [];
  commentArr2.forEach((comment) => {
    if (comment.parentId === null || comment.parentId == 'null') {
      rootComments.push(comment);
    }
  });
  let commentList = '';

  rootComments.forEach((comment) => {
    commentList += renderComment(comment);
  });
  document.getElementById('commentsList').innerHTML = commentList;
};

// Adding new comment to memory and UI
let addComment = (name, content, parent) => {
  let comment = new Comment(commentArr2.length, name, content, 0, 0, parent);
  commentArr2.unshift(comment); //unshift instead of push for reverse chronology
  if (parent != null) {
    commentArr2.forEach((comment) => {
      if (parseInt(comment.id) === parseInt(parent)) {
        comment.childrenIds.unshift(commentArr2.length - 1); //unshift instead of push for reverse chronology
      }
    });
  }
  storeComments();
  renderComments();
};

class Comment {
  constructor(id, name, content, upvotes, downvotes, parentId) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.lastUpdated = new Date();
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.childrenIds = [];
    this.parentId = parentId;
  }
  static toJSONString(comment) {
    // create JSON string to send/save on server
    return `{
			"id" : "${comment.id}",
			"name" : "${comment.name}",
			"content" : "${comment.content}",
			"upvotes" : "${comment.upvotes}",
			"downvotes" : "${comment.downvotes}",
			"lastUpdated": "${comment.lastUpdated}",
			"parentId": "${comment.parentId}",
			"childrenIds": "${JSON.stringify(comment.childrenIds)}"
		}`;
  }
}

let timeAgo = (date) => {
  // Record end time
  let endTime = new Date();

  // Compute time difference in milliseconds
  let timeDiff = endTime.getTime() - date.getTime();

  // Convert time difference from milliseconds to seconds
  timeDiff = timeDiff / 1000;

  // Extract integer seconds that dont form a minute using %
  let seconds = Math.floor(timeDiff % 60); //ignoring incomplete seconds (floor)

  // Convert time difference from seconds to minutes using %
  timeDiff = Math.floor(timeDiff / 60);

  // Extract integer minutes that don't form an hour using %
  let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds

  // Convert time difference from minutes to hours
  timeDiff = Math.floor(timeDiff / 60);

  // Extract integer hours that don't form a day using %
  let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds

  // Convert time difference from hours to days
  timeDiff = Math.floor(timeDiff / 24);

  // The rest of timeDiff is number of days
  let days = timeDiff;

  if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hours ago`;
  } else if (minutes > 0) {
    return `${minutes} minutes ago`;
  } else if (seconds > 0) {
    return `${seconds} seconds ago`;
  } else return `just now`;
};
