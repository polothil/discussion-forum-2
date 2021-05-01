let commentArr = new Array();
const dummyUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];

const defaultLoad = () => {
  let commentsString = localStorage.getItem('commentArr');
  if (commentsString !== null) {
    commentArr = JSON.parse(commentsString);
    for (let i = 0; i < commentArr.length; i++) {
      commentArr[i].lastUpdated = new Date(commentArr[i].lastUpdated); // converting to Date Object
      commentArr[i].upvotes = parseInt(commentArr[i].upvotes); // Converting string to Int
      commentArr[i].downvotes = parseInt(commentArr[i].downvotes); // Converting string to Int
      commentArr[i].childrenIds = JSON.parse(commentArr[i].childrenIds); // converting string back to array form
    }
  }
};

defaultLoad(); // FetchcommentArr(if exists) from localstorage

document.addEventListener('DOMContentLoaded', () => {
  if (commentArr.length) renderComments();

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
      id = commentArr.length - parseInt(id) - 1;

      commentArr[id][type]++;
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
  for (let i in commentArr) {
    val += Comment.toJSONString(commentArr[i]);
    i != commentArr.length - 1 ? (val += ',') : (val += '');
  }
  val += ']';
  localStorage.setItem('commentArr', val);
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
      commentArr.forEach((comment, index) => {
        if (comment.id == childrenId) {
          listElem += renderComment(commentArr[index]);
          return;
        }
      });

      // listElem += renderComment(commentArr[commentId]);
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
  commentArr.forEach((comment) => {
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
  let comment = new Comment(commentArr.length, name, content, 0, 0, parent);
  commentArr.unshift(comment); //unshift instead of push for reverse chronology
  if (parent != null) {
    commentArr.forEach((comment) => {
      if (parseInt(comment.id) === parseInt(parent)) {
        comment.childrenIds.unshift(commentArr.length - 1); //unshift instead of push for reverse chronology
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
  let currentDate = new Date();
  let yearDiff = currentDate.getFullYear() - date.getFullYear();

  if (yearDiff > 0) return `${yearDiff} year${yearDiff == 1 ? '' : 's'} ago`;

  let monthDiff = currentDate.getMonth() - date.getMonth();
  if (monthDiff > 0) return `${monthDiff} month${monthDiff == 1 ? '' : 's'} ago`;

  let dateDiff = currentDate.getDate() - date.getDate();
  if (dateDiff > 0) return `${dateDiff} day${dateDiff == 1 ? '' : 's'} ago`;

  let hourDiff = currentDate.getHours() - date.getHours();
  if (hourDiff > 0) return `${hourDiff} hour${hourDiff == 1 ? '' : 's'} ago`;

  let minuteDiff = currentDate.getMinutes() - date.getMinutes();
  if (minuteDiff > 0) return `${minuteDiff} minute${minuteDiff == 1 ? '' : 's'} ago`;

  let secondDiff = currentDate.getSeconds() - date.getSeconds();
  if (secondDiff > 0) return `${secondDiff} second${secondDiff == 1 ? '' : 's'} ago`;

  return `just now`;
};
