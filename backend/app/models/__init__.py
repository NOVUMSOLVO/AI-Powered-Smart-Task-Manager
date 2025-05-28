from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tasks = relationship("Task", back_populates="owner")


class Priority(Base):
    __tablename__ = "priorities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    weight = Column(Integer, nullable=False)

    tasks = relationship("Task", back_populates="priority")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="open")  # open, in_progress, completed, blocked
    owner_id = Column(Integer, ForeignKey("users.id"))
    priority_id = Column(Integer, ForeignKey("priorities.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    due_date = Column(DateTime(timezone=True))

    owner = relationship("User", back_populates="tasks")
    priority = relationship("Priority", back_populates="tasks")
    dependencies = relationship("TaskDependency", foreign_keys="TaskDependency.task_id", back_populates="task")
    dependents = relationship("TaskDependency", foreign_keys="TaskDependency.dependent_task_id", back_populates="dependent_task")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    dependent_task_id = Column(Integer, ForeignKey("tasks.id"))

    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    dependent_task = relationship("Task", foreign_keys=[dependent_task_id], back_populates="dependents")
