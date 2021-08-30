const videoContainer = document.getElementById("videoContainer");
const addCommentForm = document.getElementById("addCommentForm");
const addCommentFormTextarea = addCommentForm.querySelector("textarea");
const videoComments = document.querySelector(".video__comments ul");
const delBtns = document.querySelectorAll(".video__comment-del-btn");
const editBtns = document.querySelectorAll(".video__comment-edit-btn");

const editComment = (id, changedText) => {
    const comments = Array.from(videoComments.children);
    const comment = comments.find((element) => element.dataset.id === id);
    const span = comment.querySelector("span");
    span.innerText = changedText;
};

const deleteComment = (id) => {
    const comments = Array.from(videoComments.children);
    const comment = comments.find((element) => element.dataset.id === id);
    videoComments.removeChild(comment);
}

const addComment = (text, id) => {
    const newComment = document.createElement("li");
    newComment.dataset.id = id;
    newComment.className = "video__comment";
    const i1 = document.createElement("i");
    i1.classList = "fas fa-comment";
    const span = document.createElement("span");
    span.innerText = text;
    span.className = "video__comment-content";
    const delBtn = document.createElement("span");
    delBtn.innerText = "❌";
    delBtn.className = "video__comment-del-btn";
    delBtn.addEventListener("click", handleDelBtnClick);
    const i2 = document.createElement("i");
    i2.classList = "fas fa-pen";
    const editBtn = document.createElement("span");
    editBtn.className = "video__comment-edit-btn";
    editBtn.appendChild(i2);
    editBtn.addEventListener("click", handleEditBtnClick);
    
    newComment.appendChild(i1);
    newComment.appendChild(span);
    newComment.appendChild(editBtn);
    newComment.appendChild(delBtn);
    videoComments.prepend(newComment);
};

const editCommentFormSubmit = async (event) => {
    event.preventDefault();
    const editCommentForm = document.getElementById("editCommentForm");
    const textarea = editCommentForm.querySelector("textarea");
    const changedText = textarea.value;
    const {currentTarget} = event;
    const li = currentTarget.previousElementSibling;
    const span = li.querySelector(".video__comment-content");
    const originalText = span.innerText;
    const commentId = li.dataset.id;
    if (changedText === originalText) {
        li.classList.remove("hide");
        videoComments.removeChild(editCommentForm);
        return;
    }
    if (changedText === "") {
        return;
    }
    const response = await fetch(`/api/videos/${videoContainer.dataset.id}/comment/edit`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({commentId, changedText})
    });
    if (response.status === 200) {
        li.classList.remove("hide");
        videoComments.removeChild(editCommentForm);
        editComment(commentId, changedText);
    }
}


const handleAddCommentFormSubmit = async (event) => {
    event.preventDefault();
    const text = addCommentFormTextarea.value;
    const videoId = videoContainer.dataset.id;
    if (text === "") {
        return;
    }
    const response = await fetch(`/api/videos/${videoId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });
    if (response.status === 201) {
        addCommentFormTextarea.value = "";
        const {newCommentId} = await response.json();
        addComment(text, newCommentId);
    }
};

const handleEditBtnClick = (event) => {
    const editCommentForm = document.getElementById("editCommentForm");
    if (editCommentForm) {
        const selectedComment = editCommentForm.previousElementSibling;
        selectedComment.classList.remove("hide");
        editCommentForm.remove();
    }
    const currentTarget = event.currentTarget;
    const {parentNode: li} = currentTarget;
    const span = li.querySelector(".video__comment-content");
    const text = span.innerText;
    const comment = li.parentNode;
    li.classList.add("hide");
    const textarea = document.createElement("textarea");
    textarea.placeholder = "Write a nice comment...";
    textarea.value = text;
    const btn = document.createElement("button");
    btn.innerText = "Update Comment";
    const form = document.createElement("form");
    form.id = "editCommentForm";
    form.classList = "video__comment-form video__comment-form--edit";
    form.addEventListener("submit", editCommentFormSubmit);

    form.appendChild(textarea);
    form.appendChild(btn);
    comment.insertBefore(form, li.nextSibling);
    form.scrollIntoView();
};

const handleDelBtnClick = async (event) => {
    const {currentTarget: {parentElement}} = event;
    const commentId = parentElement.dataset.id;
    const videoId = videoContainer.dataset.id;
    const response = await fetch(`/api/videos/${videoId}/comment/delete`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({commentId})
    });
    if (response.status === 200) {
        deleteComment(commentId);
    }
};

const init = () => {
    addCommentForm.addEventListener("submit", handleAddCommentFormSubmit);
    delBtns.forEach((delBtn) => {
        delBtn.addEventListener("click", handleDelBtnClick);
    });
    editBtns.forEach((editBtn) => {
        editBtn.addEventListener("click", handleEditBtnClick);
    });
};

init();